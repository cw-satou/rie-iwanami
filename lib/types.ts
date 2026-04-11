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
  title: string;
  gradient: string;
  coverImage: string;
  pages: string[];
}

export interface EventItem {
  title: string;
  url: string;
  date?: string;
}

export interface MemberSession {
  memberNumber: string;
  loggedIn: boolean;
}
