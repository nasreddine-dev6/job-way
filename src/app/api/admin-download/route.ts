import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { requireAdmin } from '@/lib/auth';

const ZIP_PATH = '/home/z/my-project/download/JobWay.zip';

export async function GET(req: NextRequest) {
  const session = requireAdmin(req);
  if (session instanceof NextResponse) return session;

  try {
    const data = await readFile(ZIP_PATH);

    return new NextResponse(data, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="JobWay.zip"',
        'Content-Length': data.length.toString(),
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'الحزمة غير متوفرة حالياً. تواصل مع المسؤول.' },
      { status: 500 }
    );
  }
}
