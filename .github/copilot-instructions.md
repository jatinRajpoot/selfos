# SelfOS - Copilot Instructions

## Project Overview
SelfOS is a self-hosted personal Learning Management System (LMS) built with **Next.js 15** (App Router), **Appwrite** backend, and **Tailwind CSS v4**. Users create courses with chapters/topics, track learning progress, and take notes.

## Architecture

### Tech Stack
- **Frontend**: Next.js 15.4 with App Router, React 19, Tailwind CSS 4
- **Backend**: Appwrite (BaaS) for auth, database, and file storage
- **Animations**: Framer Motion
- **Icons**: Lucide React

### Key Directories
```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # Server-side API routes (use node-appwrite)
│   ├── auth/              # Authentication pages
│   └── dashboard/         # Protected dashboard routes
├── components/            # Reusable UI components
├── lib/
│   ├── appwrite.js        # Client-side Appwrite SDK (browser)
│   └── server/appwrite.js # Server-side Appwrite SDK (API routes)
└── scripts/               # DB setup scripts (run with node)
```

### Appwrite Client Pattern
**Client-side** (`src/lib/appwrite.js`): Uses `appwrite` package with public env vars
```javascript
import { databases, account, storage } from "@/lib/appwrite";
```

**Server-side** (`src/lib/server/appwrite.js`): Uses `node-appwrite` with secret key
```javascript
import { databases, users } from "@/lib/server/appwrite";
```

### Data Model (src/lib/config.js)
- **courses** → **chapters** → **topics** (hierarchical)
- **progress**: Tracks topic completion per user
- **notes**: User notes linked to course/chapter/topic
- **resources**: File attachments per topic

## Conventions

### Component Patterns
- All dashboard pages are client components (`"use client"`)
- Use `useToast()` hook from `@/components/Toast` for notifications
- Use `ConfirmDialog` component for destructive actions
- Skeleton components exist in `@/components/Skeleton.js` for loading states

### Data Fetching
```javascript
// Typical pattern in dashboard pages
useEffect(() => {
    const fetchData = async () => {
        const user = await account.get();
        const response = await databases.listDocuments(
            DATABASE_ID,
            COLLECTION_ID,
            [Query.equal("authorId", user.$id)]
        );
    };
    fetchData();
}, []);
```

### Dynamic Routes
- `[courseId]` pages use `use(params)` to unwrap params:
```javascript
export default function Page({ params }) {
    const { courseId } = use(params);
}
```

### Styling
- Tailwind CSS v4 with PostCSS (`@import "tailwindcss"` in app.css)
- Primary color: indigo-600
- Card pattern: `rounded-2xl bg-white shadow-sm border border-gray-100 p-6`
- Font: Inter (imported via Google Fonts in layout.js)

## Development Commands
```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run lint     # Run ESLint
node src/scripts/setup.js  # Initialize Appwrite collections
```

## Environment Variables
```
NEXT_PUBLIC_APPWRITE_ENDPOINT=  # Appwrite API endpoint
NEXT_PUBLIC_APPWRITE_PROJECT_ID=  # Public project ID
APPWRITE_KEY=  # Server-side secret key (never expose to client)
```

## Common Tasks

### Adding a New Dashboard Page
1. Create page in `src/app/dashboard/[name]/page.js`
2. Add `"use client"` directive
3. Import from `@/lib/appwrite` and `@/lib/config`
4. Add nav item to `src/app/dashboard/layout.js` navItems array

### Creating API Routes
- Place in `src/app/api/[name]/route.js`
- Use `node-appwrite` from `@/lib/server/appwrite`
- Return `NextResponse.json()` for responses
