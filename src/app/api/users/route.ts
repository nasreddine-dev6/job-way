import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { requireAuth, requireAdmin, isNextResponse } from '@/lib/auth';
import bcrypt from 'bcryptjs';

/* ════════════════════════════════════════════════════════════
   GET /api/users
   - ?action=stats  → PUBLIC  (aggregate counts only)
   - ?action=get&id=→ AUTH     (any logged-in user)
   - otherwise      → ADMIN    (full user list)
════════════════════════════════════════════════════════════ */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role') || '';
    const search = searchParams.get('search') || '';
    const action = searchParams.get('action') || '';
    const id = searchParams.get('id') || '';

    if (action === 'stats') {
      const [
        totalUsers,
        totalJobs,
        totalApplications,
        activeJobs,
        seekers,
        companies,
        pendingJobs,
        acceptedApps,
      ] = await Promise.all([
        db.user.count(),
        db.job.count(),
        db.application.count(),
        db.job.count({ where: { status: 'ACTIVE' } }),
        db.user.count({ where: { role: 'SEEKER' } }),
        db.user.count({ where: { role: 'COMPANY' } }),
        db.job.count({ where: { status: 'PENDING' } }),
        db.application.count({ where: { status: 'ACCEPTED' } }),
      ]);
      return NextResponse.json({
        stats: {
          totalUsers,
          totalJobs,
          totalApplications,
          activeJobs,
          seekers,
          companies,
          pendingJobs,
          acceptedApps,
          hireRate:
            totalApplications > 0
              ? Math.round((acceptedApps / totalApplications) * 100)
              : 0,
        },
      });
    }

    // Single user lookup (used e.g. to resolve a chat recipient name)
    if (action === 'get' && id) {
      const guard = requireAuth(req);
      if (isNextResponse(guard)) return guard;

      const user = await db.user.findUnique({
        where: { id },
        include: { company: true, resume: true },
      });
      if (!user)
        return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
      const { password: _, ...safeUser } = user;
      return NextResponse.json({ user: safeUser });
    }

    // Default: list all users (admin only)
    const adminGuard = requireAdmin(req);
    if (isNextResponse(adminGuard)) return adminGuard;

    const where: Prisma.UserWhereInput = {};
    if (role) where.role = role;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const users = await db.user.findMany({
      where,
      include: {
        company: true,
        resume: true,
        _count: { select: { applications: true, notifications: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const safeUsers = users.map(({ password: _, ...u }) => u);
    return NextResponse.json({ users: safeUsers });
  } catch {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}

/* ════════════════════════════════════════════════════════════
   PUT /api/users — admin updates a user's role/profile
════════════════════════════════════════════════════════════ */
export async function PUT(req: NextRequest) {
  try {
    const guard = requireAdmin(req);
    if (isNextResponse(guard)) return guard;

    const { id, name, role, phone } = await req.json();
    const user = await db.user.update({
      where: { id },
      data: { name, role, phone },
      include: { company: true, resume: true },
    });
    const { password: _, ...safeUser } = user;
    return NextResponse.json({ user: safeUser });
  } catch {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}

/* ════════════════════════════════════════════════════════════
   DELETE /api/users?id=... — admin only
════════════════════════════════════════════════════════════ */
export async function DELETE(req: NextRequest) {
  try {
    const guard = requireAdmin(req);
    if (isNextResponse(guard)) return guard;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id)
      return NextResponse.json(
        { error: 'معرف المستخدم مطلوب' },
        { status: 400 },
      );
    await db.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}

/* ════════════════════════════════════════════════════════════
   POST /api/users
   - action=seed-demo / seed-admin → PUBLIC  (bootstrap before login)
   - action=stats                   → PUBLIC
════════════════════════════════════════════════════════════ */
export async function POST(req: NextRequest) {
  try {
    const { action } = await req.json();

    /* ─── Aggregate stats (also reachable via GET) ─── */
    if (action === 'stats') {
      const [
        totalUsers,
        totalJobs,
        totalApplications,
        activeJobs,
        seekers,
        companies,
        pendingJobs,
        acceptedApps,
      ] = await Promise.all([
        db.user.count(),
        db.job.count(),
        db.application.count(),
        db.job.count({ where: { status: 'ACTIVE' } }),
        db.user.count({ where: { role: 'SEEKER' } }),
        db.user.count({ where: { role: 'COMPANY' } }),
        db.job.count({ where: { status: 'PENDING' } }),
        db.application.count({ where: { status: 'ACCEPTED' } }),
      ]);
      return NextResponse.json({
        stats: {
          totalUsers,
          totalJobs,
          totalApplications,
          activeJobs,
          seekers,
          companies,
          pendingJobs,
          acceptedApps,
          hireRate:
            totalApplications > 0
              ? Math.round((acceptedApps / totalApplications) * 100)
              : 0,
        },
      });
    }

    /* ─── Seed ALL demo accounts (admin + seeker + company) ─── */
    if (action === 'seed-demo') {
      const results: string[] = [];
      const salt = await bcrypt.genSalt(10);

      const demoAccounts = [
        {
          email: 'admin@jobway.demo',
          password: 'admin123',
          name: 'مدير النظام',
          role: 'ADMIN',
        },
        {
          email: 'seeker@jobway.demo',
          password: 'seeker123',
          name: 'أحمد الباحث',
          role: 'SEEKER',
        },
      ];

      for (const acc of demoAccounts) {
        const existing = await db.user.findUnique({
          where: { email: acc.email },
        });
        if (existing) {
          results.push(`${acc.email}: موجود مسبقاً`);
          continue;
        }

        const hashedPassword = await bcrypt.hash(acc.password, salt);
        const user = await db.user.create({
          data: {
            email: acc.email,
            password: hashedPassword,
            name: acc.name,
            role: acc.role,
          },
        });

        if (acc.role === 'COMPANY') {
          await db.company.create({
            data: {
              userId: user.id,
              name: acc.name,
              activityType: 'تقنية المعلومات',
              description: 'شركة متخصصة في حلول التقنية وتطوير البرمجيات.',
              website: 'https://jobway.demo',
            },
          });
        }

        if (acc.role === 'SEEKER') {
          await db.resume.create({
            data: {
              userId: user.id,
              fullName: acc.name,
              age: 26,
              education: 'بكالوريوس علوم حاسب',
              currentlyWorking: false,
              skills: JSON.stringify(['JavaScript', 'React', 'Node.js']),
              workStyle: 'individual',
              preference: 'growth',
              pressureTolerance: 'high',
              workSystem: 'fulltime',
              professionalInterest: 'technology',
              acceptTraining: true,
              acceptTemporary: true,
              acceptFieldWork: false,
            },
          });
        }

        results.push(`${acc.email}: تم الإنشاء`);
      }

      return NextResponse.json({
        message: 'تم تجهيز حسابات المعاينة بنجاح',
        accounts: [
          { role: 'ADMIN', email: 'admin@jobway.demo', password: 'admin123' },
          { role: 'SEEKER', email: 'seeker@jobway.demo', password: 'seeker123' },
        ],
        results,
      });
    }

    /* ─── Seed 4 companies + 11 real jobs ─── */
    if (action === 'seed-jobs') {
      const results: string[] = [];
      const salt = await bcrypt.genSalt(10);

      const companies = [
        {
          email: 'tech@horizon.co',
          password: 'company123',
          name: 'شركة الأفق للتكنولوجيا',
          activityType: 'technology',
          description: 'شركة رائدة في تطوير البرمجيات وحلول الذكاء الاصطناعي.',
          website: 'https://horizon.example',
          jobs: [
            {
              position: 'مطور واجهات أمامية',
              skills: ['React', 'TypeScript', 'Tailwind CSS'],
              workerStyle: 'disciplined',
              contractType: 'permanent',
              budget: '70000 د.ج',
              description: 'الانضمام لفريق تطوير منتجات الويب الحديثة باستخدام React و Next.js.',
              requirements: 'خبرة 2+ سنوات في React، إتقان TypeScript.',
              status: 'ACTIVE',
            },
            {
              position: 'مهندس برمجيات خلفية',
              skills: ['Node.js', 'PostgreSQL', 'Docker'],
              workerStyle: 'independent',
              contractType: 'permanent',
              budget: '85000 د.ج',
              description: 'تصميم وتطوير واجهات برمجية RESTful قابلة للتوسع.',
              requirements: 'خبرة في Node.js وقواعد البيانات العلائقية.',
              status: 'ACTIVE',
            },
            {
              position: 'مهندس بيانات',
              skills: ['Python', 'SQL', 'Machine Learning'],
              workerStyle: 'disciplined',
              contractType: 'permanent',
              budget: '95000 د.ج',
              description: 'تحليل بيانات ضخمة وبناء نماذج تنبؤية.',
              requirements: 'إتقان Python ومكتبات تحليل البيانات.',
              status: 'ACTIVE',
            },
          ],
        },
        {
          email: 'finance@dijla.com',
          password: 'company123',
          name: 'مؤسسة دجلة المالية',
          activityType: 'commerce',
          description: 'مؤسسة مالية متخصصة في الخدمات المصرفية والاستثمار.',
          website: 'https://dijla.example',
          jobs: [
            {
              position: 'محاسب مالي',
              skills: ['المحاسبة', 'Excel', 'تحليل مالي'],
              workerStyle: 'disciplined',
              contractType: 'permanent',
              budget: '55000 د.ج',
              description: 'مسؤول عن القيود المحاسبية وإعداد الميزانيات.',
              requirements: 'شهادة في المحاسبة أو ما يعادلها.',
              status: 'ACTIVE',
            },
            {
              position: 'محلل مالي',
              skills: ['تحليل مالي', 'Excel', 'الاستثمار'],
              workerStyle: 'independent',
              contractType: 'permanent',
              budget: '75000 د.ج',
              description: 'تحليل الأداء المالي واقتراح فرص الاستثمار.',
              requirements: 'خبرة في التحليل المالي 3+ سنوات.',
              status: 'ACTIVE',
            },
            {
              position: 'أخصائي تمويل',
              skills: ['تمويل', 'تقييم مخاطر', 'Excel'],
              workerStyle: 'disciplined',
              contractType: 'permanent',
              budget: '65000 د.ج',
              description: 'إدارة محافظ التمويل وتقييم المخاطر الائتمانية.',
              requirements: 'خلفية في العلوم المالية.',
              status: 'PENDING',
            },
          ],
        },
        {
          email: 'health@nour.med',
          password: 'company123',
          name: 'مجمع النور الطبي',
          activityType: 'health',
          description: 'مجمع طبي متعدد التخصصات يقدم رعاية صحية متكاملة.',
          website: 'https://nour.example',
          jobs: [
            {
              position: 'ممرض/ة مؤهل',
              skills: ['التمريض', 'الإسعافات الأولية', 'رعاية المرضى'],
              workerStyle: 'social',
              contractType: 'permanent',
              budget: '45000 د.ج',
              description: 'تقديم الرعاية التمريضية للمرضى في الأقسام المختلفة.',
              requirements: 'شهادة تمريض معتمدة.',
              status: 'ACTIVE',
            },
            {
              position: 'مخبري تحاليل طبية',
              skills: ['تحاليل طبية', 'المختبرات', 'دقة'],
              workerStyle: 'disciplined',
              contractType: 'permanent',
              budget: '50000 د.ج',
              description: 'إجراء الفحوصات المخبرية وتحليل النتائج.',
              requirements: 'بكالوريوس فيعلوم المختبرات الطبية.',
              status: 'ACTIVE',
            },
          ],
        },
        {
          email: 'edu@future.academy',
          password: 'company123',
          name: 'أكاديمية المستقبل التعليمية',
          activityType: 'education',
          description: 'مؤسسة تعليمية متخصصة في التدريب والتطوير المهني.',
          website: 'https://future.example',
          jobs: [
            {
              position: 'معلم لغة إنجليزية',
              skills: ['الإنجليزية', 'التدريس', 'التواصل'],
              workerStyle: 'social',
              contractType: 'permanent',
              budget: '48000 د.ج',
              description: 'تدريس اللغة الإنجليزية لجميع المستويات.',
              requirements: 'إجادة كاملة للغة الإنجليزية وخبرة في التدريس.',
              status: 'ACTIVE',
            },
            {
              position: 'مدرب مهارات تقنية',
              skills: ['البرمجة', 'التدريب', 'العرض'],
              workerStyle: 'social',
              contractType: 'temporary',
              budget: '60000 د.ج',
              description: 'تقديم دورات تدريبية في البرمجة وتقنيات الويب.',
              requirements: 'خبرة عملية في تطوير البرمجيات.',
              status: 'ACTIVE',
            },
            {
              position: 'منسق نشاطات تربوية',
              skills: ['التنظيم', 'الإدارة', 'التربية'],
              workerStyle: 'social',
              contractType: 'permanent',
              budget: '42000 د.ج',
              description: 'تنظيم الأنشطة الطلابية والفعاليات التربوية.',
              requirements: 'خلفية في العلوم التربوية.',
              status: 'PENDING',
            },
          ],
        },
      ];

      // Cleanup: remove companies (and their jobs) that are NOT in our list
      const validEmails = companies.map(c => c.email);
      const strayCompanies = await db.company.findMany({
        where: {
          user: { email: { notIn: [...validEmails, 'admin@jobway.demo', 'seeker@jobway.demo'] } },
        },
      });
      for (const stray of strayCompanies) {
        await db.job.deleteMany({ where: { companyId: stray.id } });
        await db.company.delete({ where: { id: stray.id } });
        await db.user.delete({ where: { id: stray.userId } });
        results.push(`[cleanup] حذف: ${stray.name}`);
      }

      for (const company of companies) {
        let user = await db.user.findUnique({ where: { email: company.email } });
        if (!user) {
          const hashedPassword = await bcrypt.hash(company.password, salt);
          user = await db.user.create({
            data: {
              email: company.email,
              password: hashedPassword,
              name: company.name,
              role: 'COMPANY',
            },
          });
          await db.company.create({
            data: {
              userId: user.id,
              name: company.name,
              activityType: company.activityType,
              description: company.description,
              website: company.website,
            },
          });
          results.push(`${company.name}: تم الإنشاء`);
        } else {
          results.push(`${company.name}: موجود مسبقاً`);
        }

        const companyRecord = await db.company.findUnique({
          where: { userId: user.id },
        });
        if (!companyRecord) continue;

        for (const jobData of company.jobs) {
          const existingJob = await db.job.findFirst({
            where: {
              companyId: companyRecord.id,
              position: jobData.position,
            },
          });
          if (existingJob) {
            results.push(`  └ ${jobData.position}: موجودة مسبقاً`);
            continue;
          }
          await db.job.create({
            data: {
              companyId: companyRecord.id,
              companyName: company.name,
              activityType: company.activityType,
              position: jobData.position,
              requiredSkills: JSON.stringify(jobData.skills),
              workerStyle: jobData.workerStyle,
              contractType: jobData.contractType,
              budget: jobData.budget,
              description: jobData.description,
              requirements: jobData.requirements,
              status: jobData.status,
            },
          });
          results.push(`  └ ${jobData.position}: تم الإنشاء`);
        }
      }

      return NextResponse.json({
        message: 'تم تجهيز 4 شركات و 11 وظيفة بنجاح',
        results,
      });
    }

    /* ─── Legacy: seed only the admin account ─── */
    if (action === 'seed-admin') {
      const existing = await db.user.findUnique({
        where: { email: 'admin@jobway.demo' },
      });
      if (existing) {
        return NextResponse.json({ message: 'حساب المدير موجود بالفعل' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);

      await db.user.create({
        data: {
          email: 'admin@jobway.demo',
          password: hashedPassword,
          name: 'مدير النظام',
          role: 'ADMIN',
        },
      });

      return NextResponse.json({ message: 'تم إنشاء حساب المدير بنجاح' });
    }

    return NextResponse.json({ error: 'إجراء غير صالح' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}
