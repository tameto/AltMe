/**
 * M087: SSE パーサ テスト
 * - data: イベントのパース
 * - [DONE] のスキップ
 * - 不正な JSON のスキップ
 * - マルチチャンクの蓄積
 * - readSSEStream のコールバック呼び出し
 */

import { parseSSEChunk, readSSEStream } from '../utils/sse-parser';

describe('parseSSEChunk', () => {
  it('単一の data: イベントをパースする', () => {
    const { events, remaining } = parseSSEChunk('data: {"delta":"Hello","isComplete":false}\n\n');
    expect(events).toHaveLength(1);
    expect(events[0]).toEqual({ delta: 'Hello', isComplete: false });
    expect(remaining).toBe('');
  });

  it('複数の data: イベントをパースする', () => {
    const raw = 'data: {"delta":"Hello ","isComplete":false}\n\ndata: {"delta":"World","isComplete":false}\n\n';
    const { events } = parseSSEChunk(raw);
    expect(events).toHaveLength(2);
    expect(events[0].delta).toBe('Hello ');
    expect(events[1].delta).toBe('World');
  });

  it('[DONE] イベントをスキップする', () => {
    const raw = 'data: {"delta":"ok","isComplete":false}\n\ndata: [DONE]\n\n';
    const { events } = parseSSEChunk(raw);
    expect(events).toHaveLength(1);
    expect(events[0].delta).toBe('ok');
  });

  it('isComplete イベントを検出する', () => {
    const raw = 'data: {"delta":"","isComplete":true}\n\n';
    const { events } = parseSSEChunk(raw);
    expect(events).toHaveLength(1);
    expect(events[0].isComplete).toBe(true);
  });

  it('不正な JSON をスキップする', () => {
    const raw = 'data: {invalid json}\n\ndata: {"delta":"ok"}\n\n';
    const { events } = parseSSEChunk(raw);
    expect(events).toHaveLength(1);
    expect(events[0].delta).toBe('ok');
  });

  it('data: プレフィックスのない行を無視する', () => {
    const raw = 'comment: ignore\ndata: {"delta":"ok"}\n\n';
    const { events } = parseSSEChunk(raw);
    expect(events).toHaveLength(1);
  });

  it('不完全な最終行を remaining に返す', () => {
    const raw = 'data: {"delta":"ok"}\n\ndata: {"del';
    const { events, remaining } = parseSSEChunk(raw);
    expect(events).toHaveLength(1);
    expect(remaining).toBe('data: {"del');
  });

  it('空文字列をパースする', () => {
    const { events, remaining } = parseSSEChunk('');
    expect(events).toHaveLength(0);
    expect(remaining).toBe('');
  });
});

describe('readSSEStream', () => {
  function createMockReader(chunks: string[]) {
    const encoder = new TextEncoder();
    let index = 0;
    return {
      read: jest.fn().mockImplementation(() => {
        if (index < chunks.length) {
          const chunk = chunks[index];
          index++;
          return Promise.resolve({ done: false, value: encoder.encode(chunk) });
        }
        return Promise.resolve({ done: true, value: undefined });
      }),
    } as unknown as ReadableStreamDefaultReader<Uint8Array>;
  }

  it('デルタイベントごとに onDelta コールバックが呼ばれる', async () => {
    const onDelta = jest.fn();
    const onComplete = jest.fn();
    const reader = createMockReader([
      'data: {"delta":"Hello ","isComplete":false}\n\n',
      'data: {"delta":"World","isComplete":false}\n\n',
    ]);

    await readSSEStream(reader, { onDelta, onComplete });

    expect(onDelta).toHaveBeenCalledTimes(2);
    expect(onDelta).toHaveBeenCalledWith('Hello ', 'Hello ');
    expect(onDelta).toHaveBeenCalledWith('World', 'Hello World');
  });

  it('isComplete で onComplete コールバックが呼ばれる', async () => {
    const onDelta = jest.fn();
    const onComplete = jest.fn();
    const reader = createMockReader([
      'data: {"delta":"reply","isComplete":false}\n\ndata: {"delta":"","isComplete":true}\n\n',
    ]);

    const result = await readSSEStream(reader, { onDelta, onComplete });

    expect(onComplete).toHaveBeenCalledWith('reply');
    expect(result).toBe('reply');
  });

  it('[DONE] をスキップし正常に完了する', async () => {
    const onDelta = jest.fn();
    const onComplete = jest.fn();
    const reader = createMockReader([
      'data: {"delta":"ok","isComplete":false}\n\n',
      'data: [DONE]\n\n',
      'data: {"delta":"","isComplete":true}\n\n',
    ]);

    await readSSEStream(reader, { onDelta, onComplete });

    expect(onDelta).toHaveBeenCalledWith('ok', 'ok');
    expect(onComplete).toHaveBeenCalledWith('ok');
  });

  it('全応答テキストを返す', async () => {
    const reader = createMockReader([
      'data: {"delta":"A"}\n\ndata: {"delta":"B"}\n\ndata: {"delta":"C"}\n\n',
    ]);

    const result = await readSSEStream(reader, {
      onDelta: jest.fn(),
      onComplete: jest.fn(),
    });

    expect(result).toBe('ABC');
  });

  it('空ストリームの場合は空文字を返す', async () => {
    const reader = createMockReader([]);

    const result = await readSSEStream(reader, {
      onDelta: jest.fn(),
      onComplete: jest.fn(),
    });

    expect(result).toBe('');
  });
});
