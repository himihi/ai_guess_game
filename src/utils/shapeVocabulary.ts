/**
 * 形状词库 - 定义所有支持的绘制形状及其识别规则
 * 可用于扩展、调优识别系统
 */

// 形状类型枚举
export type ShapeCategory = '物体' | '自然' | '符号' | '抽象'

export interface VocabularyEntry {
  id: string
  name: string
  category: ShapeCategory
  keywords: string[]              // 同义词/相关词
  description: string             // 对用户的说明
  difficulty: '简单' | '中等' | '困难'
  strokes: {                       // 笔画要求
    min: number
    max: number
  }
  characteristics: {
    hasClosedLoop: boolean        // 是否有闭合环
    loopCount?: number            // 期望的闭合环数量
    symmetry?: 'none' | 'vertical' | 'horizontal' | 'both'
    aspectRatioRange: [number, number]  // 宽高比范围 [min, max]
  }
  scoring: {
    basePoints: number            // 基础分
    strokePenaltyPerExtra: number // 每多一笔画的惩罚
    loopBonus: number             // 闭合环奖励
    symmetryBonus: number         // 对称性奖励
  }
}

/**
 * 完整词库 - 包含所有可识别的形状
 */
export const SHAPE_VOCABULARY: VocabularyEntry[] = [
  // === 物体类 ===
  {
    id: 'sun',
    name: '太阳',
    category: '物体',
    keywords: ['太阳', '阳光', '天体', '圆形', '光', '暖', '亮'],
    description: '一个圆形的太阳，可能有光芒',
    difficulty: '简单',
    strokes: { min: 1, max: 3 },
    characteristics: {
      hasClosedLoop: true,
      loopCount: 1,
      symmetry: 'both',
      aspectRatioRange: [0.8, 1.2]
    },
    scoring: {
      basePoints: 100,
      strokePenaltyPerExtra: 5,
      loopBonus: 10,
      symmetryBonus: 10
    }
  },
  {
    id: 'heart',
    name: '爱心',
    category: '物体',
    keywords: ['爱心', '心形', '爱', '浪漫', '心脏', '喜欢'],
    description: '一颗心形图案',
    difficulty: '简单',
    strokes: { min: 1, max: 2 },
    characteristics: {
      hasClosedLoop: true,
      loopCount: 1,
      symmetry: 'vertical',
      aspectRatioRange: [0.9, 1.3]
    },
    scoring: {
      basePoints: 100,
      strokePenaltyPerExtra: 8,
      loopBonus: 10,
      symmetryBonus: 15
    }
  },
  {
    id: 'house',
    name: '房子',
    category: '物体',
    keywords: ['房子', '房屋', '家', '建筑', '住宅', '屋顶'],
    description: '一个简单的房子图形，通常是三角形屋顶加矩形房体',
    difficulty: '简单',
    strokes: { min: 3, max: 6 },
    characteristics: {
      hasClosedLoop: false,
      symmetry: 'vertical',
      aspectRatioRange: [0.6, 1.0]
    },
    scoring: {
      basePoints: 100,
      strokePenaltyPerExtra: 5,
      loopBonus: 0,
      symmetryBonus: 10
    }
  },
  {
    id: 'car',
    name: '汽车',
    category: '物体',
    keywords: ['汽车', '车', '车辆', '交通', '轮子', '轿车'],
    description: '一辆汽车的侧面轮廓，通常有两个轮子',
    difficulty: '中等',
    strokes: { min: 3, max: 7 },
    characteristics: {
      hasClosedLoop: true,
      loopCount: 2,
      symmetry: 'horizontal',
      aspectRatioRange: [1.5, 2.5]
    },
    scoring: {
      basePoints: 120,
      strokePenaltyPerExtra: 4,
      loopBonus: 8,
      symmetryBonus: 5
    }
  },
  {
    id: 'ball',
    name: '球',
    category: '物体',
    keywords: ['球', '篮球', '足球', '圆形', '运动', '椭圆'],
    description: '一个球形或椭圆形物体',
    difficulty: '简单',
    strokes: { min: 1, max: 2 },
    characteristics: {
      hasClosedLoop: true,
      loopCount: 1,
      symmetry: 'both',
      aspectRatioRange: [0.5, 1.5]
    },
    scoring: {
      basePoints: 80,
      strokePenaltyPerExtra: 10,
      loopBonus: 10,
      symmetryBonus: 10
    }
  },
  {
    id: 'cloud',
    name: '云朵',
    category: '物体',
    keywords: ['云', '云朵', '天空', '天气', '白色', '飘浮'],
    description: '一朵蓬松的云',
    difficulty: '中等',
    strokes: { min: 1, max: 4 },
    characteristics: {
      hasClosedLoop: false,
      symmetry: 'none',
      aspectRatioRange: [1.2, 2.5]
    },
    scoring: {
      basePoints: 80,
      strokePenaltyPerExtra: 8,
      loopBonus: 0,
      symmetryBonus: 0
    }
  },

  // === 自然类 ===
  {
    id: 'tree',
    name: '树木',
    category: '自然',
    keywords: ['树', '树木', '植物', '自然', '森林', '绿叶'],
    description: '一棵树，通常有圆形树冠和树干',
    difficulty: '中等',
    strokes: { min: 2, max: 5 },
    characteristics: {
      hasClosedLoop: true,
      loopCount: 1,
      symmetry: 'vertical',
      aspectRatioRange: [0.8, 1.5]
    },
    scoring: {
      basePoints: 100,
      strokePenaltyPerExtra: 6,
      loopBonus: 8,
      symmetryBonus: 10
    }
  },
  {
    id: 'flower',
    name: '花朵',
    category: '自然',
    keywords: ['花', '花朵', '花卉', '植物', '春天', '花瓣'],
    description: '一朵花，有多个花瓣围绕中心',
    difficulty: '中等',
    strokes: { min: 2, max: 8 },
    characteristics: {
      hasClosedLoop: true,
      loopCount: 1,
      symmetry: 'both',
      aspectRatioRange: [0.8, 1.2]
    },
    scoring: {
      basePoints: 100,
      strokePenaltyPerExtra: 5,
      loopBonus: 10,
      symmetryBonus: 15
    }
  },
  {
    id: 'mountain',
    name: '山',
    category: '自然',
    keywords: ['山', '山脉', '山峰', '自然', '风景'],
    description: '一座或多座山峰',
    difficulty: '简单',
    strokes: { min: 1, max: 3 },
    characteristics: {
      hasClosedLoop: false,
      symmetry: 'none',
      aspectRatioRange: [1.0, 3.0]
    },
    scoring: {
      basePoints: 90,
      strokePenaltyPerExtra: 8,
      loopBonus: 0,
      symmetryBonus: 5
    }
  },

  // === 符号类 ===
  {
    id: 'star',
    name: '星星',
    category: '符号',
    keywords: ['星星', '星形', '星空', '闪烁', '五角星', '闪亮'],
    description: '一颗五角星',
    difficulty: '中等',
    strokes: { min: 1, max: 5 },
    characteristics: {
      hasClosedLoop: false,
      symmetry: 'vertical',
      aspectRatioRange: [0.8, 1.2]
    },
    scoring: {
      basePoints: 100,
      strokePenaltyPerExtra: 8,
      loopBonus: 0,
      symmetryBonus: 15
    }
  },
  {
    id: 'smile',
    name: '笑脸',
    category: '符号',
    keywords: ['笑脸', '开心', '微笑', '表情', '快乐', '哈哈'],
    description: '一个笑脸表情，通常是弧形嘴巴加圆脸',
    difficulty: '简单',
    strokes: { min: 1, max: 3 },
    characteristics: {
      hasClosedLoop: true,
      loopCount: 1,
      symmetry: 'vertical',
      aspectRatioRange: [0.9, 1.1]
    },
    scoring: {
      basePoints: 100,
      strokePenaltyPerExtra: 10,
      loopBonus: 10,
      symmetryBonus: 10
    }
  },
  {
    id: 'music-note',
    name: '音符',
    category: '符号',
    keywords: ['音符', '音乐', '歌曲', '旋律', '节奏'],
    description: '一个音乐音符符号',
    difficulty: '简单',
    strokes: { min: 1, max: 2 },
    characteristics: {
      hasClosedLoop: false,
      symmetry: 'none',
      aspectRatioRange: [0.5, 1.0]
    },
    scoring: {
      basePoints: 90,
      strokePenaltyPerExtra: 10,
      loopBonus: 0,
      symmetryBonus: 0
    }
  },

  // === 抽象类 ===
  {
    id: 'lightning',
    name: '闪电',
    category: '抽象',
    keywords: ['闪电', '雷', '雷电', 'electric', 'power'],
    description: '一道闪电路径',
    difficulty: '简单',
    strokes: { min: 1, max: 2 },
    characteristics: {
      hasClosedLoop: false,
      symmetry: 'none',
      aspectRatioRange: [0.5, 2.0]
    },
    scoring: {
      basePoints: 100,
      strokePenaltyPerExtra: 8,
      loopBonus: 0,
      symmetryBonus: 0
    }
  },
  {
    id: 'arrow',
    name: '箭头',
    category: '抽象',
    keywords: ['箭头', '方向', '指向', 'forward'],
    description: '一个指向某个方向的箭头',
    difficulty: '简单',
    strokes: { min: 1, max: 3 },
    characteristics: {
      hasClosedLoop: false,
      symmetry: 'vertical',
      aspectRatioRange: [1.0, 2.0]
    },
    scoring: {
      basePoints: 90,
      strokePenaltyPerExtra: 8,
      loopBonus: 0,
      symmetryBonus: 5
    }
  }
]

/**
 * 按难度分组
 */
export const getShapesByDifficulty = (difficulty: ShapeCategory): VocabularyEntry[] => {
  return SHAPE_VOCABULARY.filter(s => s.category === difficulty)
}

/**
 * 获取所有唯一关键词（用于搜索匹配）
 */
export const getAllKeywords = (): string[] => {
  const keywords = new Set<string>()
  for (const shape of SHAPE_VOCABULARY) {
    for (const kw of shape.keywords) {
      keywords.add(kw)
    }
  }
  return Array.from(keywords)
}

/**
 * 根据关键词查找可能的形状
 */
export const findShapesByKeyword = (keyword: string): VocabularyEntry[] => {
  return SHAPE_VOCABULARY.filter(shape =>
    shape.keywords.some(kw => kw.includes(keyword) || keyword.includes(kw))
  )
}
