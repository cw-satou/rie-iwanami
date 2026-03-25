export interface NewsItem {
  date: string;
  tag: string;
  title: string;
  url?: string;
}

export interface BlogPost {
  date: string;
  title: string;
  excerpt: string;
  url: string;
  thumbnail?: string;
}

export interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
  channelTitle: string;
}

export interface Newsletter {
  id: string;
  vol: string;
  issue: string;
  gradient: string;
  imageUrl?: string;
}

export interface MemberSession {
  memberNumber: string;
  loggedIn: boolean;
}
