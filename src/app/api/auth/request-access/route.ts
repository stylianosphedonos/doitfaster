import { NextResponse } from "next/server";
import { hashPassword } from "@/lib/password";
import {
  createAccessRequest,
  usernameExists,
} from "@/lib/users-db";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    username?: string;
    password?: string;
    email?: string;
    phone?: string;
    address?: string;
  };

  if (!body.username?.trim() || !body.password || !body.email?.trim()) {
    return NextResponse.json(
      { error: "Username, password, and email are required" },
      { status: 400 }
    );
  }

  if (body.password.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters" },
      { status: 400 }
    );
  }

  if (await usernameExists(body.username.trim())) {
    return NextResponse.json(
      { error: "Username is already taken or pending approval" },
      { status: 409 }
    );
  }

  const passwordHash = await hashPassword(body.password);
  const accessRequest = await createAccessRequest({
    username: body.username.trim(),
    email: body.email.trim(),
    passwordHash,
    phone: body.phone,
    address: body.address,
  });

  return NextResponse.json(
    { id: accessRequest.id, message: "Access request submitted" },
    { status: 201 }
  );
}
