import React from 'react';
import { QualityAnalysisBase } from './QualityAnalysisBase';
import { DefectType } from '../../utils/analysisUtils';

export function CigaretteQualityAnalysis() {
  return <QualityAnalysisBase defectType={DefectType.CIGARETTE} />;
}

export default CigaretteQualityAnalysis;
