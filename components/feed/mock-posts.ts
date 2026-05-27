export type PostTag = "Case Study" | "Article" | "Update" | "Photo";

export interface MockPost {
  id: string;
  author: string;
  specialty: string;
  hospital: string;
  tag: PostTag;
  time: string;
  body: string;
  boldTerms?: string[];
  hasImage?: boolean;
  likes: number;
  comments: number;
}

export const MOCK_POSTS: MockPost[] = [
  {
    id: "1",
    author: "Dr. Ananya Sharma",
    specialty: "Cardiology",
    hospital: "Apollo Hospitals",
    tag: "Case Study",
    time: "2h ago",
    body: "Interesting case of acute pericarditis in a 34-year-old presenting with atypical chest pain. ECG showed diffuse ST elevation — responded well to NSAIDs and colchicine.",
    boldTerms: ["acute pericarditis", "diffuse ST elevation"],
    hasImage: true,
    likes: 24,
    comments: 8,
  },
  {
    id: "2",
    author: "Dr. Raj Patel",
    specialty: "Internal Medicine",
    hospital: "Fortis Healthcare",
    tag: "Article",
    time: "5h ago",
    body: "New ACC/AHA guidelines on hypertension management emphasize earlier intervention and combination therapy. Worth a read for primary care colleagues.",
    boldTerms: ["hypertension management"],
    likes: 41,
    comments: 12,
  },
  {
    id: "3",
    author: "Dr. Meera Iyer",
    specialty: "Pediatrics",
    hospital: "Manipal Hospital",
    tag: "Update",
    time: "1d ago",
    body: "Heading to the IAP annual conference next week. Happy to connect with fellow pediatricians attending — drop a comment!",
    likes: 18,
    comments: 5,
  },
];

export const TAG_STYLES: Record<
  PostTag,
  { bg: string; text: string }
> = {
  "Case Study": { bg: "bg-green-light", text: "text-green-primary" },
  Article: { bg: "bg-[#dde8fc]", text: "text-[#2d4a8a]" },
  Update: { bg: "bg-[#fde8d0]", text: "text-[#8a5a30]" },
  Photo: { bg: "bg-[#ede8fc]", text: "text-[#5a4a8a]" },
};
