#!/usr/bin/env python3
import json
import urllib.request

QWEN_URL = "http://134.199.199.229:8000/v1/chat/completions"

pages = {
    "dashboard": "Create a Next.js dashboard page component for ArcWork platform. Dark theme, Tailwind CSS. Show: 1) User stats cards (achievements, invoices, subscriptions count), 2) Recent activity list, 3) Quick action buttons. Use wagmi for wallet connection. Import Navbar from components. Export default function Dashboard(). Production-ready, responsive, modern design.",
    
    "achievements": "Create a Next.js achievements page for ArcWork. Dark theme, Tailwind. Show: 1) Grid of achievement badges with icons and titles, 2) Filter buttons by category, 3) Achievement details on click. Export default function Achievements().",
    
    "invoice": "Create a Next.js invoice page for ArcWork. Dark theme, Tailwind. Show: 1) Create invoice form (client address, amount USDC, description), 2) Invoice list with status badges (Pending/Paid), 3) Pay invoice functionality. Export default function Invoice().",
    
    "subscription": "Create a Next.js subscription page for ArcWork. Dark theme, Tailwind. Show: 1) Create subscription form (creator address, amount, interval monthly/yearly), 2) Active subscriptions list, 3) Cancel button, 4) Next billing date. Export default function Subscription().",
    
    "landing": "Create a landing page for ArcWork - Achievement + Invoice + Subscription platform on Arc Network. Hero section with gradient, 3 feature cards (Achievement, Invoice, Subscription), CTA buttons, modern dark design. Export default function Home()."
}

for name, prompt in pages.items():
    print(f"🔄 Generating {name}...")
    
    body = json.dumps({
        "model": "Qwen/Qwen3-Coder-30B-A3B-Instruct",
        "messages": [{"role": "user", "content": prompt + "\n\nReturn ONLY the TSX/JSX code. Use 'use client' directive at top. No markdown fences, just raw code."}],
        "max_tokens": 4096,
        "temperature": 0.7
    }).encode()
    
    req = urllib.request.Request(QWEN_URL, data=body, headers={"Content-Type": "application/json"})
    
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            data = json.loads(resp.read())
            content = data["choices"][0]["message"]["content"]
            
            # Clean up markdown fences if present
            if content.startswith("```"):
                lines = content.split("\n")
                content = "\n".join(lines[1:-1])
            
            with open(f"/root/arcwork/frontend/src/app/{name}/page.tsx", "w") as f:
                f.write(content)
            
            print(f"✅ {name}: Saved ({len(content)} chars)")
    except Exception as e:
        print(f"❌ {name}: {e}")

print("\n🎉 All done!")
