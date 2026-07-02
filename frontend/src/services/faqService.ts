import faqData from '@/mocks/faq.json'

export type FaqCategory = (typeof faqData)[number]

export const faqCategories = faqData
