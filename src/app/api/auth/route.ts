import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createSession, clearSession, requireAuth, isNextResponse } from '@/lib/auth';
import bcrypt from 'bcryptjs';

async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/* ════════════════════════════════════════════════════════════
   POST /api/auth — login / register / logout
════════════════════════════════════════════════════════════ */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    /* ─── Login ─── */
    if (action === 'login') {
      const { email, password } = body;
      const user = await db.user.findUnique({
        where: { email },
        include: { company: true, resume: true },
      });

      if (!user) {
        return NextResponse.json(
          { error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' },
          { status: 401 },
        );
      }

      const valid = await verifyPassword(password, user.password);
      if (!valid) {
        return NextResponse.json(
          { error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' },
          { status: 401 },
        );
      }

      const { password: _, ...safeUser } = user;
      const response = NextResponse.json({ user: safeUser });
      createSession(response, { id: user.id, role: user.role });
      return response;
    }

    /* ─── Register ─── */
    if (action === 'register') {
      const { email, password, name, role, phone } = body;

      const existing = await db.user.findUnique({ where: { email } });
      if (existing) {
        return NextResponse.json(
          { error: 'هذا البريد الإلكتروني مستخدم بالفعل' },
          { status: 400 },
        );
      }

      const hashedPassword = await hashPassword(password);
      const user = await db.user.create({
        data: { email, password: hashedPassword, name, role, phone },
        include: { company: true, resume: true },
      });

      // For COMPANY accounts, create the Company record and
      // re-fetch so the returned user includes `company` (needed
      // by the dashboard to resolve the company id).
      if (role === 'COMPANY') {
        await db.company.create({
          data: { userId: user.id, name, activityType: 'أخرى' },
        });
        const refreshed = await db.user.findUnique({
          where: { id: user.id },
          include: { company: true, resume: true },
        });
        const { password: _pw, ...safeUser } = refreshed!;
        const response = NextResponse.json({ user: safeUser });
        createSession(response, { id: user.id, role: user.role });
        return response;
      }

      const { password: _pw, ...safeUser } = user;
      const response = NextResponse.json({ user: safeUser });
      createSession(response, { id: user.id, role: user.role });
      return response;
    }

    /* ─── Logout ─── */
    if (action === 'logout') {
      const response = NextResponse.json({ success: true });
      clearSession(response);
      return response;
    }

    return NextResponse.json({ error: 'إجراء غير صالح' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}

/* ════════════════════════════════════════════════════════════
   PUT /api/auth — profile update (auth required, self only)
════════════════════════════════════════════════════════════ */
export async function PUT(req: NextRequest) {
  try {
    const guard = requireAuth(req);
    if (isNextResponse(guard)) return guard;
    const session = guard;

    const { userId, name, phone } = await req.json();

    // A user may only update their own profile; admins may
    // update any user's basic info.
    if (session.role !== 'ADMIN' && userId !== session.userId) {
      return NextResponse.json(
        { error: 'غير مصرح — يمكنك تعديل ملفك الشخصي فقط' },
        { status: 403 },
      );
    }

    const user = await db.user.update({
      where: { id: userId },
      data: { name, phone },
      include: { company: true, resume: true },
    });
    const { password: _, ...safeUser } = user;
    return NextResponse.json({ user: safeUser });
  } catch {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}
