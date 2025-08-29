import { isNonEmptyString, toStringArray } from './utils';

export type KeywordResearchData = {
  semanticKeywords: string[];
  longTailKeywords: string[];
  relatedQuestions: string[];
  contentGaps: string[];
  topic?: string;
  keyword?: string;
};

export type ContentBriefData = {
  audienceProfile: {
    description: string;
    painPoints: string[];
    goals: string[];
  };
  contentStrategy: {
    uniqueAngle: string;
    structureApproach: string;
    toneAndStyle: string;
  };
  successMetrics: string[];
};

export type OutlineSection = {
  heading: string;
  summary: string;
  keyPoints: string[];
};

export type OutlineData = {
  title: string;
  introductionPlan: string;
  mainSections: OutlineSection[];
  faqPlan: string[];
  conclusionPlan: string;
  estimatedWordCount: number;
};

export function validateKeywordResearch(input: unknown): KeywordResearchData {
  if (typeof input !== 'object' || input === null) throw new Error('Keyword research must be an object');
  const o = input as Record<string, unknown>;
  const semanticKeywords = toStringArray(o.semanticKeywords, 'semanticKeywords');
  const longTailKeywords = toStringArray(o.longTailKeywords, 'longTailKeywords');
  const relatedQuestions = toStringArray(o.relatedQuestions, 'relatedQuestions');
  const contentGaps = toStringArray(o.contentGaps, 'contentGaps');

  if (semanticKeywords.length < 10) throw new Error('At least 10 semanticKeywords are required');
  if (longTailKeywords.length < 5) throw new Error('At least 5 longTailKeywords are required');
  if (relatedQuestions.length < 5) throw new Error('At least 5 relatedQuestions are required');

  const topic = isNonEmptyString(o.topic) ? o.topic.trim() : undefined;
  const keyword = isNonEmptyString(o.keyword) ? o.keyword.trim() : undefined;

  return { semanticKeywords, longTailKeywords, relatedQuestions, contentGaps, topic, keyword };
}

export function validateContentBrief(input: unknown): ContentBriefData {
  if (typeof input !== 'object' || input === null) throw new Error('Content brief must be an object');
  const o = input as Record<string, unknown>;
  const audienceProfile = o.audienceProfile as Record<string, unknown>;
  const contentStrategy = o.contentStrategy as Record<string, unknown>;
  const successMetrics = toStringArray(o.successMetrics, 'successMetrics');

  if (!audienceProfile || typeof audienceProfile !== 'object') throw new Error('audienceProfile is required');
  const description = isNonEmptyString(audienceProfile.description) ? audienceProfile.description : '';
  const painPoints = toStringArray(audienceProfile.painPoints, 'audienceProfile.painPoints');
  const goals = toStringArray(audienceProfile.goals, 'audienceProfile.goals');
  if (!description || painPoints.length === 0 || goals.length === 0) throw new Error('audienceProfile must include description, painPoints, and goals');

  if (!contentStrategy || typeof contentStrategy !== 'object') throw new Error('contentStrategy is required');
  const uniqueAngle = isNonEmptyString(contentStrategy.uniqueAngle) ? contentStrategy.uniqueAngle : '';
  const structureApproach = isNonEmptyString(contentStrategy.structureApproach) ? contentStrategy.structureApproach : '';
  const toneAndStyle = isNonEmptyString(contentStrategy.toneAndStyle) ? contentStrategy.toneAndStyle : '';
  if (!uniqueAngle || !structureApproach || !toneAndStyle) throw new Error('contentStrategy must include uniqueAngle, structureApproach, toneAndStyle');

  if (successMetrics.length === 0) throw new Error('successMetrics must include at least one metric');

  return {
    audienceProfile: { description, painPoints, goals },
    contentStrategy: { uniqueAngle, structureApproach, toneAndStyle },
    successMetrics,
  };
}

export function validateOutline(input: unknown): OutlineData {
  if (typeof input !== 'object' || input === null) throw new Error('Outline must be an object');
  const o = input as Record<string, unknown>;

  const title = isNonEmptyString(o.title) ? o.title : '';
  const introductionPlan = isNonEmptyString(o.introductionPlan) ? o.introductionPlan : '';
  const conclusionPlan = isNonEmptyString(o.conclusionPlan) ? o.conclusionPlan : '';
  const estimatedWordCount = typeof o.estimatedWordCount === 'number' ? o.estimatedWordCount : NaN;

  const mainSectionsRaw = o.mainSections;
  if (!Array.isArray(mainSectionsRaw)) throw new Error('mainSections must be an array');
  const mainSections = mainSectionsRaw.map((s, idx) => {
    if (typeof s !== 'object' || s === null) throw new Error(`mainSections[${idx}] must be an object`);
    const sec = s as Record<string, unknown>;
    const heading = isNonEmptyString(sec.heading) ? sec.heading : '';
    const summary = isNonEmptyString(sec.summary) ? sec.summary : '';
    const keyPoints = toStringArray(sec.keyPoints, `mainSections[${idx}].keyPoints`);
    if (!heading || !summary || keyPoints.length === 0) throw new Error(`mainSections[${idx}] requires heading, summary, keyPoints`);
    return { heading, summary, keyPoints };
  });

  const faqPlan = toStringArray(o.faqPlan, 'faqPlan');

  if (!title || !introductionPlan || !conclusionPlan) throw new Error('title, introductionPlan, and conclusionPlan are required');
  if (Number.isNaN(estimatedWordCount)) throw new Error('estimatedWordCount must be a number');
  if (mainSections.length < 3) throw new Error('At least 3 mainSections are required');
  if (estimatedWordCount < 2000) throw new Error('estimatedWordCount must be 2000 or more');

  return { title, introductionPlan, conclusionPlan, estimatedWordCount, mainSections, faqPlan };
}

