import { NextRequest, NextResponse } from 'next/server';

const WORDPRESS_GRAPHQL_URL = process.env.WORDPRESS_GRAPHQL_URL || 'http://yilicorp.local/graphql';

/**
 * POST /api/graphql
 * 代理 GraphQL 请求到 WordPress
 * 这样可以让客户端组件访问 WordPress GraphQL API
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, variables } = body;

    if (!query) {
      return NextResponse.json(
        { error: 'Missing query parameter' },
        { status: 400 }
      );
    }

    // 转发请求到 WordPress GraphQL
    const response = await fetch(WORDPRESS_GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables: variables || {},
      }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `WordPress GraphQL error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    // CORS 头部允许客户端访问
    const responseWithCors = NextResponse.json(data);
    responseWithCors.headers.set('Access-Control-Allow-Origin', '*');
    responseWithCors.headers.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    responseWithCors.headers.set('Access-Control-Allow-Headers', 'Content-Type');

    return responseWithCors;
  } catch (error) {
    console.error('GraphQL API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch from WordPress GraphQL' },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS /api/graphql
 * 处理 CORS 预检请求
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

