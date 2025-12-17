import { EvaluationMetric } from '@/types';

export function rmse(predicted: number[], actual: number[]): number {
  if (predicted.length !== actual.length) {
    throw new Error('Predicted and actual arrays must have the same length');
  }

  const n = predicted.length;
  const sumSquaredErrors = predicted.reduce((sum, pred, i) => {
    const error = pred - actual[i];
    return sum + error * error;
  }, 0);

  return Math.sqrt(sumSquaredErrors / n);
}

export function accuracy(predicted: string[], actual: string[]): number {
  if (predicted.length !== actual.length) {
    throw new Error('Predicted and actual arrays must have the same length');
  }

  const correct = predicted.filter((pred, i) => pred === actual[i]).length;
  return correct / predicted.length;
}

export function f1Score(predicted: string[], actual: string[]): number {
  if (predicted.length !== actual.length) {
    throw new Error('Predicted and actual arrays must have the same length');
  }

  // Binary classification: assume positive class is '1' or 'true'
  const positiveClasses = ['1', 'true', 'yes', 'positive'];

  let tp = 0, fp = 0, fn = 0;

  for (let i = 0; i < predicted.length; i++) {
    const predPositive = positiveClasses.includes(predicted[i].toLowerCase());
    const actualPositive = positiveClasses.includes(actual[i].toLowerCase());

    if (predPositive && actualPositive) tp++;
    else if (predPositive && !actualPositive) fp++;
    else if (!predPositive && actualPositive) fn++;
  }

  const precision = tp / (tp + fp) || 0;
  const recall = tp / (tp + fn) || 0;

  if (precision + recall === 0) return 0;
  return 2 * (precision * recall) / (precision + recall);
}

export function auc(predicted: number[], actual: number[]): number {
  if (predicted.length !== actual.length) {
    throw new Error('Predicted and actual arrays must have the same length');
  }

  // Simple AUC calculation using trapezoidal rule
  const pairs: Array<{ pred: number; actual: number }> = predicted.map((pred, i) => ({
    pred,
    actual: actual[i],
  }));

  // Sort by predicted score descending
  pairs.sort((a, b) => b.pred - a.pred);

  let positives = 0;
  let negatives = 0;
  let sumRanks = 0;

  pairs.forEach((pair, rank) => {
    if (pair.actual === 1) {
      positives++;
      sumRanks += rank + 1;
    } else {
      negatives++;
    }
  });

  if (positives === 0 || negatives === 0) return 0.5;

  const aucValue = (sumRanks - (positives * (positives + 1)) / 2) / (positives * negatives);
  return 1 - aucValue; // Flip because we sorted descending
}

// ==================== Object Detection Metrics ====================

interface BoundingBox {
  image_id: string;
  class: string;
  x_min: number;
  y_min: number;
  x_max: number;
  y_max: number;
  confidence?: number;
}

function parseBox(row: Record<string, string>): BoundingBox {
  return {
    image_id: row.image_id,
    class: row.class || row.label || row.category,
    x_min: parseFloat(row.x_min || row.xmin || row.x1),
    y_min: parseFloat(row.y_min || row.ymin || row.y1),
    x_max: parseFloat(row.x_max || row.xmax || row.x2),
    y_max: parseFloat(row.y_max || row.ymax || row.y2),
    confidence: row.confidence ? parseFloat(row.confidence) : undefined,
  };
}

function calculateIoU(boxA: BoundingBox, boxB: BoundingBox): number {
  const xA = Math.max(boxA.x_min, boxB.x_min);
  const yA = Math.max(boxA.y_min, boxB.y_min);
  const xB = Math.min(boxA.x_max, boxB.x_max);
  const yB = Math.min(boxA.y_max, boxB.y_max);

  const interWidth = Math.max(0, xB - xA);
  const interHeight = Math.max(0, yB - yA);
  const interArea = interWidth * interHeight;

  const boxAArea = (boxA.x_max - boxA.x_min) * (boxA.y_max - boxA.y_min);
  const boxBArea = (boxB.x_max - boxB.x_min) * (boxB.y_max - boxB.y_min);

  const unionArea = boxAArea + boxBArea - interArea;

  return unionArea > 0 ? interArea / unionArea : 0;
}

function calculateAP(predictions: BoundingBox[], groundTruths: BoundingBox[], iouThreshold: number): number {
  if (groundTruths.length === 0) return predictions.length === 0 ? 1 : 0;
  if (predictions.length === 0) return 0;

  // Sort predictions by confidence descending
  const sortedPreds = [...predictions].sort((a, b) => (b.confidence || 0) - (a.confidence || 0));

  const gtMatched = new Set<number>();
  const tpFp: Array<{ tp: number; fp: number }> = [];

  for (const pred of sortedPreds) {
    let bestIoU = 0;
    let bestGtIdx = -1;

    // Find best matching ground truth
    for (let i = 0; i < groundTruths.length; i++) {
      if (gtMatched.has(i)) continue;
      if (groundTruths[i].image_id !== pred.image_id) continue;
      if (groundTruths[i].class !== pred.class) continue;

      const iou = calculateIoU(pred, groundTruths[i]);
      if (iou > bestIoU) {
        bestIoU = iou;
        bestGtIdx = i;
      }
    }

    if (bestIoU >= iouThreshold && bestGtIdx >= 0) {
      gtMatched.add(bestGtIdx);
      tpFp.push({ tp: 1, fp: 0 });
    } else {
      tpFp.push({ tp: 0, fp: 1 });
    }
  }

  // Calculate precision-recall curve
  let cumTp = 0;
  let cumFp = 0;
  const precisions: number[] = [];
  const recalls: number[] = [];

  for (const { tp, fp } of tpFp) {
    cumTp += tp;
    cumFp += fp;
    precisions.push(cumTp / (cumTp + cumFp));
    recalls.push(cumTp / groundTruths.length);
  }

  // Calculate AP using all-point interpolation
  let ap = 0;
  let prevRecall = 0;

  // Make precision monotonically decreasing (from right to left)
  for (let i = precisions.length - 2; i >= 0; i--) {
    precisions[i] = Math.max(precisions[i], precisions[i + 1]);
  }

  for (let i = 0; i < recalls.length; i++) {
    const recallDiff = recalls[i] - prevRecall;
    ap += recallDiff * precisions[i];
    prevRecall = recalls[i];
  }

  return ap;
}

export function map50(
  predictionRows: Record<string, string>[],
  groundTruthRows: Record<string, string>[]
): number {
  const predictions = predictionRows.map(parseBox);
  const groundTruths = groundTruthRows.map(parseBox);

  // Get unique classes
  const classes = new Set<string>();
  groundTruths.forEach(gt => classes.add(gt.class));
  predictions.forEach(pred => classes.add(pred.class));

  if (classes.size === 0) return 0;

  // Calculate AP for each class
  let totalAP = 0;
  let classCount = 0;

  for (const cls of classes) {
    const classPreds = predictions.filter(p => p.class === cls);
    const classGts = groundTruths.filter(gt => gt.class === cls);

    // Skip classes with no ground truths
    if (classGts.length === 0) continue;

    const ap = calculateAP(classPreds, classGts, 0.5);
    totalAP += ap;
    classCount++;
  }

  return classCount > 0 ? totalAP / classCount : 0;
}

export const evaluators: Record<EvaluationMetric, (predicted: unknown[], actual: unknown[]) => number> = {
  rmse: (pred, act) => rmse(pred as number[], act as number[]),
  accuracy: (pred, act) => accuracy(pred as string[], act as string[]),
  f1: (pred, act) => f1Score(pred as string[], act as string[]),
  auc: (pred, act) => auc(pred as number[], act as number[]),
  map50: (pred, act) => map50(pred as Record<string, string>[], act as Record<string, string>[]),
};

// Whether higher is better for each metric
export const higherIsBetter: Record<EvaluationMetric, boolean> = {
  rmse: false,
  accuracy: true,
  f1: true,
  auc: true,
  map50: true,
};

// Metrics that require full CSV row data (not just target column)
export const requiresFullData: Record<EvaluationMetric, boolean> = {
  rmse: false,
  accuracy: false,
  f1: false,
  auc: false,
  map50: true,
};
