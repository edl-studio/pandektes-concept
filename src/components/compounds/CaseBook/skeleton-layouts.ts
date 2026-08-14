/**
 * Skeleton bar patterns, lifted 1:1 from the Figma "Page" component
 * (node 40:17992) SkeletonTextRow variants. Each layout is a list of bar
 * widths as a % of the row's full width; `fillLast` means the final bar
 * flex-grows to fill the remaining space instead of using a fixed %.
 */
interface SkeletonRowLayout {
  widths: number[]
  fillLast?: boolean
}

const ROW_WIDTH_PX = 141.06444881798234

const LAYOUT_1: SkeletonRowLayout = { widths: [48.067981228232384 / ROW_WIDTH_PX * 100], fillLast: true }
const LAYOUT_2: SkeletonRowLayout = {
  widths: [64.06737087666988 / ROW_WIDTH_PX * 100, 32.068591579794884 / ROW_WIDTH_PX * 100],
}
const LAYOUT_3: SkeletonRowLayout = {
  widths: [32.068591579794884 / ROW_WIDTH_PX * 100, 80.06676052510738 / ROW_WIDTH_PX * 100],
}
const LAYOUT_4: SkeletonRowLayout = {
  widths: [
    48.067981228232384 / ROW_WIDTH_PX * 100,
    24.068896755576134 / ROW_WIDTH_PX * 100,
    32.068591579794884 / ROW_WIDTH_PX * 100,
  ],
}
const LAYOUT_5: SkeletonRowLayout = {
  widths: [24.068896755576134 / ROW_WIDTH_PX * 100, 96.06615017354488 / ROW_WIDTH_PX * 100],
}
const LAYOUT_6: SkeletonRowLayout = { widths: [64.06737087666988 / ROW_WIDTH_PX * 100] }

/** The exact row sequence per text group, as laid out in the Figma "Page" component. */
export const PAGE_SKELETON_GROUPS: SkeletonRowLayout[][] = [
  [LAYOUT_2, LAYOUT_1, LAYOUT_6],
  [LAYOUT_6, LAYOUT_2, LAYOUT_1, LAYOUT_2, LAYOUT_3],
  [LAYOUT_3, LAYOUT_2, LAYOUT_4, LAYOUT_5],
]
