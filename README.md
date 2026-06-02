ProjectBots.AI | AI Chatbot & Voice Agent Platform for Businesses

Lambda, API Gateway(REST/WebSocket), DynamoDB, SQS/SNS, Step Functions, Elasti Cache, CloudWatch, X-Ray, S3, CloudFront, CDK 

A full-stack AI SaaS platform using Next.js 14 (TypeScript, Tailwind CSS, App Router), Fast API (Python) with PostgreSQL as the primary 
database, Chroma DB (vector database) and Redis for caching.  

Production grade RAG pipeline using sentence transformers (all-MiniLM-L6-v2) for semantic embeddings, Groq API (Llama 3.1 8B) as the 
LLM enabling AI chatbots to answer exclusively from business uploaded knowledge (PDFs, DOCX, text) with hallucination control, multi-turn 
conversation memory and real time source attribution via WebSocket. 

A Public REST API authenticated via API keys, Stripe subscription billing, plan based usage and analytics dashboard with Recharts powered 
daily trend charts, peak hours, and customer conversation export (CSV). 

Implemented Voice AI phone system integrating Twilio webhooks for inbound call handling, Deepgram voice cloning API to replicate a custom 
voice sample, and Amazon Polly as a neural TTS with a voice-optimized RAG pipeline(Grok) achieving ~2 second E2E response latency, human 
handoff (call transfer via Dial) and full call transcript logging. 
