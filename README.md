# Mackolik Clone ⚽

Live score web application inspired by Mackolik.

## Features

- Live football match scores
- Today and recent match listing
- Match status filters: All, Live, Finished, Not Started
- Team logos
- Goal and card event details
- Match detail page
- Match statistics
- Auto-refreshing data

## Tech Stack

### Frontend
- Next.js
- TypeScript
- React

### Backend
- Node.js
- Express.js
- Axios
- API-Football

## Project Structure

```txt
mackolik-clone/
├── backend/
│   ├── index.js
│   └── package.json
└── frontend/
    ├── src/app/
    │   ├── page.tsx
    │   └── match/[id]/page.tsx
    └── package.json