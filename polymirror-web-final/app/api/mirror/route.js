import { NextResponse } from "next/server";
import { createMirrorJobs } from "../../../lib/mirror";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const body = await req.json();
    const url = String(body?.url || "").trim();
    const title = String(body?.title || "").trim();
    const hosts = Array.isArray(body?.hosts) ? body.hosts : [];

    if (!/^https?:\/\//i.test(url)) {
      return NextResponse.json({ error: "A valid HTTP(S) URL is required." }, { status: 400 });
    }
    if (!hosts.length) {
      return NextResponse.json({ error: "Select at least one host." }, { status: 400 });
    }

    // Safety/ownership boundary: this endpoint only accepts a URL supplied by the user.
    // Host adapters below should be wired only to documented APIs you are authorized to use.
    const jobs = await createMirrorJobs({ url, title, hosts });
    return NextResponse.json({ jobs });
  } catch (e) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}