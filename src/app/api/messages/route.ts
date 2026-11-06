import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { requireAuth, isNextResponse } from '@/lib/auth';

/* ════════════════════════════════════════════════════════════
   GET /api/messages?userId=...[&otherId=...]
   AUTH + userId must match session (or admin)
════════════════════════════════════════════════════════════ */
export async function GET(req: NextRequest) {
  try {
    const guard = requireAuth(req);
    if (isNextResponse(guard)) return guard;
    const session = guard;

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || '';
    const otherId = searchParams.get('otherId') || '';

    if (!userId) {
      return NextResponse.json(
        { error: 'معرف المستخدم مطلوب' },
        { status: 400 },
      );
    }
    if (session.role !== 'ADMIN' && userId !== session.userId) {
      return NextResponse.json(
        { error: 'غير مصرح — يمكنك الاطلاع على رسائلك فقط' },
        { status: 403 },
      );
    }

    const where: Prisma.MessageWhereInput = {};
    where.OR = [{ senderId: userId }, { receiverId: userId }];
    if (otherId) {
      where.AND = [
        { OR: [{ senderId: userId }, { receiverId: userId }] },
        { OR: [{ senderId: otherId }, { receiverId: otherId }] },
      ];
    }

    const messages = await db.message.findMany({
      where,
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
        receiver: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ messages });
  } catch {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}

/* ════════════════════════════════════════════════════════════
   POST /api/messages — send a message
   AUTH + senderId must match session
════════════════════════════════════════════════════════════ */
export async function POST(req: NextRequest) {
  try {
    const guard = requireAuth(req);
    if (isNextResponse(guard)) return guard;
    const session = guard;

    const { senderId, receiverId, applicationId, content } = await req.json();

    if (session.role !== 'ADMIN' && senderId !== session.userId) {
      return NextResponse.json(
        { error: 'غير مصرح — لا يمكنك إرسال رسالة نيابة عن مستخدم آخر' },
        { status: 403 },
      );
    }

    const message = await db.message.create({
      data: { senderId, receiverId, applicationId, content },
      include: { sender: { select: { id: true, name: true, avatar: true } } },
    });

    await db.notification.create({
      data: {
        userId: receiverId,
        title: 'رسالة جديدة',
        message: `رسالة من ${message.sender.name}`,
        type: 'MESSAGE',
      },
    });

    return NextResponse.json({ message });
  } catch {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}

/* ════════════════════════════════════════════════════════════
   PUT /api/messages — mark messages as read
   AUTH + receiverId (the user marking as read) must match session
════════════════════════════════════════════════════════════ */
export async function PUT(req: NextRequest) {
  try {
    const guard = requireAuth(req);
    if (isNextResponse(guard)) return guard;
    const session = guard;

    const { id, senderId, receiverId } = await req.json();

    // Mark a whole conversation as read — the receiver is the
    // current session user (or admin acting on their behalf).
    if (senderId && receiverId) {
      if (session.role !== 'ADMIN' && receiverId !== session.userId) {
        return NextResponse.json(
          { error: 'غير مصرح' },
          { status: 403 },
        );
      }
      await db.message.updateMany({
        where: { senderId, receiverId, read: false },
        data: { read: true },
      });
      return NextResponse.json({ success: true });
    }

    if (id) {
      // Verify the message belongs to the session user before
      // marking it as read.
      const message = await db.message.findUnique({
        where: { id },
        select: { receiverId: true },
      });
      if (!message) {
        return NextResponse.json({ error: 'الرسالة غير موجودة' }, { status: 404 });
      }
      if (session.role !== 'ADMIN' && message.receiverId !== session.userId) {
        return NextResponse.json(
          { error: 'غير مصرح' },
          { status: 403 },
        );
      }
      await db.message.updateMany({
        where: { id },
        data: { read: true },
      });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}
