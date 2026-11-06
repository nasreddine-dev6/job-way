import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, isNextResponse } from '@/lib/auth';

/* ════════════════════════════════════════════════════════════
   GET /api/resume?userId=...
   AUTH + userId must match session (or admin)
════════════════════════════════════════════════════════════ */
export async function GET(req: NextRequest) {
  try {
    const guard = requireAuth(req);
    if (isNextResponse(guard)) return guard;
    const session = guard;

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    if (!userId) {
      return NextResponse.json(
        { error: 'معرف المستخدم مطلوب' },
        { status: 400 },
      );
    }
    if (session.role !== 'ADMIN' && userId !== session.userId) {
      return NextResponse.json(
        { error: 'غير مصرح — يمكنك الاطلاع على سيرتك الذاتية فقط' },
        { status: 403 },
      );
    }

    const resume = await db.resume.findUnique({ where: { userId } });
    return NextResponse.json({ resume });
  } catch {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}

/* ════════════════════════════════════════════════════════════
   POST /api/resume — create or update own resume
   AUTH + userId must match session
════════════════════════════════════════════════════════════ */
export async function POST(req: NextRequest) {
  try {
    const guard = requireAuth(req);
    if (isNextResponse(guard)) return guard;
    const session = guard;

    const data = await req.json();
    const {
      userId,
      fullName,
      age,
      education,
      currentlyWorking,
      skills,
      workStyle,
      preference,
      pressureTolerance,
      workSystem,
      professionalInterest,
      acceptTraining,
      acceptTemporary,
      acceptFieldWork,
      resumeFile,
    } = data;

    if (session.role !== 'ADMIN' && userId !== session.userId) {
      return NextResponse.json(
        { error: 'غير مصرح — يمكنك تعديل سيرتك الذاتية فقط' },
        { status: 403 },
      );
    }

    const existing = await db.resume.findUnique({ where: { userId } });
    let resume;
    if (existing) {
      resume = await db.resume.update({
        where: { userId },
        data: {
          fullName,
          age: parseInt(age),
          education,
          currentlyWorking,
          skills: JSON.stringify(skills || []),
          workStyle,
          preference,
          pressureTolerance,
          workSystem,
          professionalInterest,
          acceptTraining,
          acceptTemporary,
          acceptFieldWork,
          resumeFile: resumeFile || existing.resumeFile,
        },
      });
    } else {
      resume = await db.resume.create({
        data: {
          userId,
          fullName,
          age: parseInt(age),
          education,
          currentlyWorking,
          skills: JSON.stringify(skills || []),
          workStyle: workStyle || 'individual',
          preference: preference || 'stability',
          pressureTolerance: pressureTolerance || 'medium',
          workSystem: workSystem || 'fulltime',
          professionalInterest: professionalInterest || 'other',
          acceptTraining: acceptTraining || false,
          acceptTemporary: acceptTemporary || false,
          acceptFieldWork: acceptFieldWork || false,
          resumeFile,
        },
      });
    }
    return NextResponse.json({ resume });
  } catch {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}
