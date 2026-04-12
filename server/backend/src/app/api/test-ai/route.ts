import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import "dotenv/config";

export async function GET(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_CLOUD_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ 
        success: false, 
        error: "API Key not found in environment variables." 
      }, { status: 400 });
    }

    const google = createGoogleGenerativeAI({ apiKey });
    
    const { text } = await generateText({
      model: google("gemini-1.5-flash"),
      prompt: "Say 'CourtMate AI is ready!' if you can hear me.",
    });

    return NextResponse.json({ 
      success: true, 
      message: text,
      modelUsed: "gemini-1.5-flash"
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error("AI Test Error:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
