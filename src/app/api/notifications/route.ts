import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, isNextResponse } from '@/lib/auth';

/* ════════════════════════════════════════════════════════════
   GET /api/notifications?userId=...
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
        { error: 'غير مصرح — يمكنك الاطلاع على إشعاراتك فقط' },
        { status: 403 },
      );
    }

    const notifications = await db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ notifications });
  } catch {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}

/* ════════════════════════════════════════════════════════════
   POST /api/notifications — create notification
   AUTH required
════════════════════════════════════════════════════════════ */
export async function POST(req: NextRequest) {
  try {
    const guard = requireAuth(req);
    if (isNextResponse(guard)) return guard;
    const session = guard;

    const { userId, title, message, type } = await req.json();

    // Only admins may create notifications for other users.
    if (session.role !== 'ADMIN' && userId !== session.userId) {
      return NextResponse.json(
        { error: 'غير مصرح — لا يمكنك إنشاء إشعارات لمستخدمين آخرين' },
        { status: 403 },
      );
    }

    const notification = await db.notification.create({
      data: { userId, title, message, type: type || 'SYSTEM' },
    });
    return NextResponse.json({ notification });
  } catch {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}

/* ════════════════════════════════════════════════════════════
   PUT /api/notifications — mark notification(s) as read
   AUTH + ownership verified
════════════════════════════════════════════════════════════ */
export async function PUT(req: NextRequest) {
  try {
    const guard = requireAuth(req);
    if (isNextResponse(guard)) return guard;
    const session = guard;

    const { id, markAll, userId } = await req.json();
    if (markAll && userId) {
      if (session.role !== 'ADMIN' && userId !== session.userId) {
        return NextResponse.json(
          { error: 'غير مصرح' },
          { status: 403 },
        );
      }
      await db.notification.updateMany({
        where: { userId, read: false },
        data: { read: true },
      });
    } else if (id) {
      const notification = await db.notification.findUnique({
        where: { id },
        select: { userId: true },
      });
      if (!notification) {
        return NextResponse.json(
          { error: 'الإشعار غير موجود' },
          { status: 404 },
        );
      }
      if (session.role !== 'ADMIN' && notification.userId !== session.userId) {
        return NextResponse.json(
          { error: 'غير مصرح' },
          { status: 403 },
        );
      }
      await db.notification.update({ where: { id }, data: { read: true } });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}

/* ════════════════════════════════════════════════════════════
   DELETE /api/notifications?userId=... — AUTH + ownership
════════════════════════════════════════════════════════════ */
export async function DELETE(req: NextRequest) {
  try {
    const guard = requireAuth(req);
    if (isNextResponse(guard)) return guard;
    const session = guard;

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    if (userId) {
      if (session.role !== 'ADMIN' && userId !== session.userId) {
        return NextResponse.json(
          { error: 'غير مصرح' },
          { status: 403 },
        );
      }
      await db.notification.deleteMany({ where: { userId } });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}
