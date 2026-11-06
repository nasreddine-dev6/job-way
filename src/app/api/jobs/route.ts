import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { requireAuth, isNextResponse, SessionUser } from '@/lib/auth';

/* ════════════════════════════════════════════════════════════
   GET /api/jobs — PUBLIC (job listings are visible to anyone)
════════════════════════════════════════════════════════════ */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'ACTIVE';
    const search = searchParams.get('search') || '';
    const activityType = searchParams.get('activityType') || '';
    const contractType = searchParams.get('contractType') || '';
    const skill = searchParams.get('skill') || '';
    const companyId = searchParams.get('companyId') || '';
    const id = searchParams.get('id') || '';
    const sortBy = searchParams.get('sortBy') || 'newest';

    if (id) {
      const job = await db.job.findUnique({
        where: { id },
        include: {
          company: true,
          applications: {
            include: { seeker: { include: { resume: true } } },
            orderBy: { createdAt: 'desc' },
          },
          _count: { select: { applications: true } },
        },
      });
      if (!job) {
        return NextResponse.json({ error: 'الوظيفة غير موجودة' }, { status: 404 });
      }
      await db.job.update({ where: { id }, data: { views: { increment: 1 } } });
      return NextResponse.json({ job });
    }

    const where: Prisma.JobWhereInput = {};
    if (status !== 'ALL') where.status = status;
    if (companyId) where.companyId = companyId;
    if (search) {
      where.OR = [
        { position: { contains: search } },
        { companyName: { contains: search } },
        { description: { contains: search } },
      ];
    }
    if (activityType) where.activityType = activityType;
    if (contractType) where.contractType = contractType;
    if (skill) where.requiredSkills = { contains: skill };

    const orderBy: Prisma.JobOrderByWithRelationInput =
      sortBy === 'oldest' ? { createdAt: 'asc' } : { createdAt: 'desc' };

    const jobs = await db.job.findMany({
      where,
      orderBy,
      include: {
        _count: { select: { applications: true } },
        company: true,
      },
    });

    return NextResponse.json({ jobs });
  } catch {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}

/* ════════════════════════════════════════════════════════════
   Helper: verify that the session user owns the given job
   (company owner of the job, or admin)
════════════════════════════════════════════════════════════ */
async function canManageJob(
  session: SessionUser,
  jobId: string,
): Promise<boolean> {
  if (session.role === 'ADMIN') return true;
  if (session.role !== 'COMPANY') return false;
  const job = await db.job.findUnique({
    where: { id: jobId },
    select: { company: { select: { userId: true } } },
  });
  if (!job) return false;
  return job.company.userId === session.userId;
}

/* ════════════════════════════════════════════════════════════
   POST /api/jobs — create job
   AUTH + role COMPANY (or ADMIN with a Company record).
   companyId is derived from the authenticated user's Company
   record, NOT from the request body.
════════════════════════════════════════════════════════════ */
export async function POST(req: NextRequest) {
  try {
    const guard = requireAuth(req);
    if (isNextResponse(guard)) return guard;
    const session = guard;

    if (session.role !== 'COMPANY' && session.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'غير مصرح — هذه العملية مخصصة لجهات التوظيف' },
        { status: 403 },
      );
    }

    // Resolve the company from the session user — admins must
    // have a Company record to post a job (matches the demo
    // flow where admins operate on users, not jobs).
    const company = await db.company.findUnique({
      where: { userId: session.userId },
      select: { id: true, name: true },
    });
    if (!company) {
      return NextResponse.json(
        { error: 'لم يتم العثور على ملف المؤسسة' },
        { status: 403 },
      );
    }

    const data = await req.json();
    const {
      activityType,
      position,
      requiredSkills,
      workerStyle,
      contractType,
      budget,
      description,
      requirements,
      status,
    } = data;

    const job = await db.job.create({
      data: {
        companyId: company.id,
        companyName: company.name,
        activityType,
        position,
        requiredSkills: JSON.stringify(requiredSkills || []),
        workerStyle: workerStyle || 'disciplined',
        contractType: contractType || 'permanent',
        budget: budget || null,
        description,
        requirements,
        status: status || 'PENDING',
      },
      include: { _count: { select: { applications: true } }, company: true },
    });

    return NextResponse.json({ job });
  } catch {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}

/* ════════════════════════════════════════════════════════════
   PUT /api/jobs — update job (status / fields)
   AUTH + ownership (company owner) OR admin
════════════════════════════════════════════════════════════ */
export async function PUT(req: NextRequest) {
  try {
    const guard = requireAuth(req);
    if (isNextResponse(guard)) return guard;
    const session = guard;

    const { id, ...data } = await req.json();
    if (!id) {
      return NextResponse.json(
        { error: 'معرف الوظيفة مطلوب' },
        { status: 400 },
      );
    }

    const allowed = await canManageJob(session, id);
    if (!allowed) {
      return NextResponse.json(
        { error: 'غير مصرح — لا تملك هذه الوظيفة' },
        { status: 403 },
      );
    }

    const updateData: Prisma.JobUpdateInput = {};
    if (data.position !== undefined) updateData.position = data.position;
    if (data.companyName !== undefined) updateData.companyName = data.companyName;
    if (data.activityType !== undefined) updateData.activityType = data.activityType;
    if (data.requiredSkills !== undefined) {
      updateData.requiredSkills =
        typeof data.requiredSkills === 'string'
          ? data.requiredSkills
          : JSON.stringify(data.requiredSkills);
    }
    if (data.workerStyle !== undefined) updateData.workerStyle = data.workerStyle;
    if (data.contractType !== undefined) updateData.contractType = data.contractType;
    if (data.budget !== undefined) updateData.budget = data.budget;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.requirements !== undefined) updateData.requirements = data.requirements;
    if (data.status !== undefined) updateData.status = data.status;

    const job = await db.job.update({
      where: { id },
      data: updateData,
      include: { _count: { select: { applications: true } }, company: true },
    });

    return NextResponse.json({ job });
  } catch {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}

/* ════════════════════════════════════════════════════════════
   DELETE /api/jobs?id=... — AUTH + ownership OR admin
════════════════════════════════════════════════════════════ */
export async function DELETE(req: NextRequest) {
  try {
    const guard = requireAuth(req);
    if (isNextResponse(guard)) return guard;
    const session = guard;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json(
        { error: 'معرف الوظيفة مطلوب' },
        { status: 400 },
      );
    }

    const allowed = await canManageJob(session, id);
    if (!allowed) {
      return NextResponse.json(
        { error: 'غير مصرح — لا تملك هذه الوظيفة' },
        { status: 403 },
      );
    }

    await db.job.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}
