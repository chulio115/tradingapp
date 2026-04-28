import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const { data: rules, error } = await supabase
      .from("AlertRule")
      .select("*")
      .order("createdAt", { ascending: false });

    if (error) throw error;
    return Response.json(rules ?? []);
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

    const { data: rule, error } = await supabase
      .from("AlertRule")
      .insert({ name, type, conditions, channel })
      .select()
      .single();

    if (error) throw error;
    return Response.json(rule);
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

    const { data: rule, error } = await supabase
      .from("AlertRule")
      .update({ active })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return Response.json(rule);
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

    const { error } = await supabase
      .from("AlertRule")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return Response.json({ success: true });
  } catch (error) {
    console.error("Failed to delete alert rule:", error);
    return Response.json(
      { error: "Failed to delete alert" },
      { status: 500 }
    );
  }
}
