import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, isNextResponse } from '@/lib/auth';

/* ════════════════════════════════════════════════════════════
   GET /api/company?userId=...
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
        { error: 'غير مصرح — يمكنك الاطلاع على ملف مؤسستك فقط' },
        { status: 403 },
      );
    }

    const company = await db.company.findUnique({ where: { userId } });
    return NextResponse.json({ company });
  } catch {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}

/* ════════════════════════════════════════════════════════════
   POST /api/company — create or update own company
   AUTH + userId must match session
════════════════════════════════════════════════════════════ */
export async function POST(req: NextRequest) {
  try {
    const guard = requireAuth(req);
    if (isNextResponse(guard)) return guard;
    const session = guard;

    const data = await req.json();
    const { userId, name, activityType, description, website } = data;

    if (session.role !== 'ADMIN' && userId !== session.userId) {
      return NextResponse.json(
        { error: 'غير مصرح — يمكنك تعديل ملف مؤسستك فقط' },
        { status: 403 },
      );
    }

    const existing = await db.company.findUnique({ where: { userId } });
    let company;
    if (existing) {
      company = await db.company.update({
        where: { userId },
        data: { name, activityType, description, website },
      });
    } else {
      company = await db.company.create({
        data: { userId, name, activityType, description, website },
      });
    }
    return NextResponse.json({ company });
  } catch {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}
