import { describe, expect, it } from 'vitest'
import { clamp, cn, escapeRegExp } from './utils'

describe('cn', () => {
  it('joins truthy classes and drops the rest', () => {
    expect(cn('a', false, undefined, 'b', null, '')).toBe('a b')
  })

  it('returns an empty string when nothing is truthy', () => {
    expect(cn(false, undefined)).toBe('')
  })
})

describe('escapeRegExp', () => {
  it('neutralises characters that would otherwise change the pattern', () => {
    expect(escapeRegExp('a.b*c')).toBe('a\\.b\\*c')
  })

  it('makes a literal search safe to compile', () => {
    const keyword = 'total (net)'
    const regex = new RegExp(escapeRegExp(keyword), 'gi')
    expect('Total (net) due'.match(regex)).toHaveLength(1)
    // Without escaping, the parentheses would form a group and match nothing.
    expect(regex.source).toContain('\\(')
  })
})

describe('clamp', () => {
  it.each([
    [5, 0, 10, 5],
    [-1, 0, 10, 0],
    [11, 0, 10, 10],
  ])('clamp(%i, %i, %i) is %i', (value, min, max, expected) => {
    expect(clamp(value, min, max)).toBe(expected)
  })
})
