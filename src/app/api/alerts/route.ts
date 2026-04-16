import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const rules = await prisma.alertRule.findMany({
      orderBy: { createdAt: "desc" },
    });
    return Response.json(
      rules.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }))
    );
  } catch (error) {
    console.error("Failed to fetch alert rules:", error);
    return Response.json({ error: "Failed to fetch alerts" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, type, conditions, channel } = body as {
      name: string;
      type: string;
      conditions: string;
      channel: string;
    };

    const rule = await prisma.alertRule.create({
      data: { name, type, conditions, channel },
    });

    return Response.json({
      ...rule,
      createdAt: rule.createdAt.toISOString(),
    });
  } catch (error) {
    console.error("Failed to create alert rule:", error);
    return Response.json(
      { error: "Failed to create alert" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, active } = body as { id: string; active: boolean };

    const rule = await prisma.alertRule.update({
      where: { id },
      data: { active },
    });

    return Response.json({
      ...rule,
      createdAt: rule.createdAt.toISOString(),
    });
  } catch (error) {
    console.error("Failed to update alert rule:", error);
    return Response.json(
      { error: "Failed to update alert" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body as { id: string };

    await prisma.alertRule.delete({ where: { id } });
    return Response.json({ success: true });
  } catch (error) {
    console.error("Failed to delete alert rule:", error);
    return Response.json(
      { error: "Failed to delete alert" },
      { status: 500 }
    );
  }
}
