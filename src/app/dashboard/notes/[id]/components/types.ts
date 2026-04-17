export interface Note {
  id: string;
  title: string;
  content?: string;
  visibility: "public" | "private";
  summary?: string | null;
  summaryStatus?: "pending" | "accepted" | "rejected";
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    email: string;
    fullName?: string;
  };
}
