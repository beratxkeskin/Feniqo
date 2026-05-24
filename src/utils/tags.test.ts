import { describe, it, expect } from 'vitest';
import { extractHashtags } from '../context/DataContext';

describe('Hashtag Parser Engine', () => {
  it('should extract correct hashtags from text descriptions', () => {
    const text = 'Mutfak alışverişi #market #gıda';
    const tags = extractHashtags(text);
    expect(tags).toEqual(['market', 'gıda']);
  });

  it('should support uppercase and lowercase folder mapping', () => {
    const text = 'Haftasonu sinema keyfi #EĞLENCE #Sinema';
    const tags = extractHashtags(text);
    expect(tags).toEqual(['eğlence', 'sinema']);
  });

  it('should handle Turkish characters correctly', () => {
    const text = 'Şirket yemek faturası #iş #vergi #özel_ödemeler #kişisel';
    const tags = extractHashtags(text);
    expect(tags).toEqual(['iş', 'vergi', 'özel_ödemeler', 'kişisel']);
  });

  it('should return empty array if no tags are present', () => {
    const text = 'Halı saha maçı ödemesi';
    const tags = extractHashtags(text);
    expect(tags).toEqual([]);
  });

  it('should return empty array for empty inputs or raw hashtag character', () => {
    expect(extractHashtags('')).toEqual([]);
    expect(extractHashtags(undefined)).toEqual([]);
    expect(extractHashtags('just a symbol #')).toEqual([]);
    expect(extractHashtags('another symbol # ')).toEqual([]);
  });

  it('should ignore duplicate hashtags', () => {
    const text = 'Büyük market alışverişi #market #gıda #market';
    const tags = extractHashtags(text);
    expect(tags).toEqual(['market', 'gıda']);
  });
});
