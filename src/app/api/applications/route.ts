import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { requireAuth, isNextResponse, SessionUser } from '@/lib/auth';

/* ════════════════════════════════════════════════════════════
   Helper: can the session user manage an application?
   - ADMIN: always yes
   - COMPANY: yes if they own the job the application belongs to
   - SEEKER: no (status changes are not seeker-driven)
════════════════════════════════════════════════════════════ */
async function canManageApplication(
  session: SessionUser,
  applicationId: string,
): Promise<boolean> {
  if (session.role === 'ADMIN') return true;
  if (session.role !== 'COMPANY') return false;
  const application = await db.application.findUnique({
    where: { id: applicationId },
    select: { job: { select: { company: { select: { userId: true } } } } },
  });
  if (!application) return false;
  return application.job.company.userId === session.userId;
}

/* ════════════════════════════════════════════════════════════
   GET /api/applications — AUTH
   - SEEKER: only their own applications
   - COMPANY: applications for their jobs
   - ADMIN: all applications
════════════════════════════════════════════════════════════ */
export async function GET(req: NextRequest) {
  try {
    const guard = requireAuth(req);
    if (isNextResponse(guard)) return guard;
    const session = guard;

    const { searchParams } = new URL(req.url);
    const seekerId = searchParams.get('seekerId') || '';
    const jobId = searchParams.get('jobId') || '';

    const where: Prisma.ApplicationWhereInput = {};

    if (session.role === 'SEEKER') {
      where.seekerId = session.userId;
    } else if (session.role === 'COMPANY') {
      // Restrict to jobs owned by this company, but allow an
      // explicit jobId filter to further narrow down.
      const company = await db.company.findUnique({
        where: { userId: session.userId },
        select: { id: true },
      });
      if (!company) {
        return NextResponse.json({ applications: [] });
      }
      where.job = { companyId: company.id };
      if (jobId) where.jobId = jobId;
    }
    // ADMIN — no extra filter (sees all applications)

    // Allow an explicit seekerId filter only when permitted:
    // SEEKERs are forced to their own id; COMPANY/ADMIN may pass any.
    if (session.role !== 'SEEKER' && seekerId) {
      where.seekerId = seekerId;
    }
    if (session.role === 'SEEKER' && jobId) {
      where.jobId = jobId;
    }

    const applications = await db.application.findMany({
      where,
      include: {
        job: { include: { company: true } },
        seeker: { include: { resume: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ applications });
  } catch {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}

/* ════════════════════════════════════════════════════════════
   POST /api/applications — apply to a job
   AUTH + seekerId must match session (or admin)
════════════════════════════════════════════════════════════ */
export async function POST(req: NextRequest) {
  try {
    const guard = requireAuth(req);
    if (isNextResponse(guard)) return guard;
    const session = guard;

    const { jobId, seekerId } = await req.json();

    if (session.role !== 'ADMIN' && seekerId !== session.userId) {
      return NextResponse.json(
        { error: 'غير مصرح — لا يمكنك التقديم نيابة عن مستخدم آخر' },
        { status: 403 },
      );
    }

    const existing = await db.application.findFirst({
      where: { jobId, seekerId },
    });
    if (existing) {
      return NextResponse.json(
        { error: 'لقد تقدمت لهذه الوظيفة بالفعل' },
        { status: 400 },
      );
    }

    const application = await db.application.create({
      data: { jobId, seekerId, status: 'PENDING' },
      include: {
        job: { include: { company: true } },
        seeker: true,
      },
    });

    // Notify the company about the new applicant
    const job = await db.job.findUnique({
      where: { id: jobId },
      include: { company: true },
    });
    if (job) {
      await db.notification.create({
        data: {
          userId: job.company.userId,
          title: 'متقدم جديد',
          message: `تقدم ${application.seeker?.name || 'باحث'} لوظيفة ${job.position}`,
          type: 'NEW_APPLICANT',
        },
      });
    }

    return NextResponse.json({ application });
  } catch {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}

/* ════════════════════════════════════════════════════════════
   PUT /api/applications — update status / rating / notes
   AUTH + ownership (company owns the job) OR admin.
   Seekers are denied.
════════════════════════════════════════════════════════════ */
export async function PUT(req: NextRequest) {
  try {
    const guard = requireAuth(req);
    if (isNextResponse(guard)) return guard;
    const session = guard;

    const { id, status, rating, notes } = await req.json();

    if (session.role === 'SEEKER') {
      return NextResponse.json(
        { error: 'غير مصرح — لا يمكن للباحث تعديل حالة طلبه' },
        { status: 403 },
      );
    }

    const allowed = await canManageApplication(session, id);
    if (!allowed) {
      return NextResponse.json(
        { error: 'غير مصرح — لا تملك هذا الطلب' },
        { status: 403 },
      );
    }

    const updateData: Prisma.ApplicationUpdateInput = {};
    if (status) updateData.status = status;
    if (rating !== undefined) updateData.rating = rating;
    if (notes !== undefined) updateData.notes = notes;

    const application = await db.application.update({
      where: { id },
      data: updateData,
      include: {
        job: { include: { company: true } },
        seeker: true,
      },
    });

    // Notify the seeker about the application status update
    if (status) {
      const statusText = status === 'ACCEPTED' ? 'تم قبول' : 'تم رفض';
      await db.notification.create({
        data: {
          userId: application.seekerId,
          title: 'تحديث طلب التوظيف',
          message: `${statusText} طلبك لوظيفة ${application.job?.position}`,
          type: 'APPLICATION_UPDATE',
        },
      });
    }

    return NextResponse.json({ application });
  } catch {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}

/* ════════════════════════════════════════════════════════════
   DELETE /api/applications?id=... — AUTH + ownership
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
        { error: 'معرف الطلب مطلوب' },
        { status: 400 },
      );
    }

    // Seekers can delete their own applications; companies /
    // admins can delete applications they manage.
    if (session.role === 'SEEKER') {
      const application = await db.application.findUnique({
        where: { id },
        select: { seekerId: true },
      });
      if (!application || application.seekerId !== session.userId) {
        return NextResponse.json(
          { error: 'غير مصرح — لا تملك هذا الطلب' },
          { status: 403 },
        );
      }
    } else {
      const allowed = await canManageApplication(session, id);
      if (!allowed) {
        return NextResponse.json(
          { error: 'غير مصرح — لا تملك هذا الطلب' },
          { status: 403 },
        );
      }
    }

    await db.application.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}
