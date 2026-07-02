import mockNews from '@/mocks/news.json'

export type NewsItem = (typeof mockNews)[number]

export const newsItems = mockNews

export function getNewsById(id: number): NewsItem | undefined {
  return newsItems.find(n => n.id === id)
}
