import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { 
  isSandboxMode, 
  generateSandboxFraudStats 
} from '@/lib/sandbox';

export async function GET(request: NextRequest) {
  try {
    // In sandbox mode, return generated fraud stats
    if (isSandboxMode()) {
      const stats = generateSandboxFraudStats();
      return NextResponse.json(stats);
    }

    // In production mode, check authentication
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // In production mode, integrate with actual API
    // For now, return empty stats
    return NextResponse.json({
      totalChecks: 0,
      approvedCount: 0,
      reviewCount: 0,
      declinedCount: 0,
      averageScore: 0,
      averageProcessingTime: 0,
      scoreDistribution: [],
      topRiskFactors: []
    });
    
  } catch (error) {
    console.error('Error fetching fraud stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}