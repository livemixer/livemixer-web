import { describe, expect, it } from 'vitest';
import { cn } from './utils';

describe('utils > cn', () => {
  it('应合并多个 class 字符串', () => {
    expect(cn('a', 'b')).toBe('a b');
  });

  it('应跳过 falsy 值', () => {
    expect(cn('a', false && 'b', null, undefined, 'c')).toBe('a c');
  });

  it('应通过 twMerge 处理重复的 tailwind 类（后者覆盖前者）', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });

  it('应支持数组与对象式输入', () => {
    expect(cn(['a', 'b'], { c: true, d: false })).toBe('a b c');
  });

  it('无入参时返回空字符串', () => {
    expect(cn()).toBe('');
  });
});
