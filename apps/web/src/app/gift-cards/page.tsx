'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StateWrapper } from '@/components/states/state-wrapper';
import { 
  Gift,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  MoreHorizontal,
  DollarSign,
  Calendar,
  Users,
  TrendingUp
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface GiftCard {
  id: string;
  code: string;
  amount: number;
  currency: string;
  status: 'active' | 'used' | 'expired' | 'cancelled';
  recipientEmail: string;
  purchaserEmail: string;
  message: string;
  expiresAt: string;
  usedAt?: string;
  createdAt: string;
  merchantId: string;
}

interface GiftCardStats {
  totalCards: number;
  totalValue: number;
  activeCards: number;
  usedCards: number;
  redemptionRate: number;
  averageValue: number;
}

export default function GiftCardsPage() {
  const { data: session } = useSession();
  const [giftCards, setGiftCards] = useState<GiftCard[]>([]);
  const [stats, setStats] = useState<GiftCardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadGiftCardsData();
  }, []);

  const loadGiftCardsData = async () => {
    setLoading(true);
    try {
      // Mock data for now - replace with actual API calls
      const mockStats: GiftCardStats = {
        totalCards: 1247,
        totalValue: 48750.00,
        activeCards: 892,
        usedCards: 298,
        redemptionRate: 78.5,
        averageValue: 39.12
      };

      const mockGiftCards: GiftCard[] = [
        {
          id: 'gc_1',
          code: 'GIFT-2024-ABC123',
          amount: 50.00,
          currency: 'USD',
          status: 'active',
          recipientEmail: 'recipient@example.com',
          purchaserEmail: 'buyer@example.com',
          message: 'Happy Birthday!',
          expiresAt: '2024-12-31T23:59:59Z',
          createdAt: '2024-01-15T10:30:00Z',
          merchantId: 'merchant_1'
        },
        {
          id: 'gc_2',
          code: 'GIFT-2024-DEF456',
          amount: 25.00,
          currency: 'USD',
          status: 'used',
          recipientEmail: 'john.doe@example.com',
          purchaserEmail: 'jane.smith@example.com',
          message: 'Thank you for your help!',
          expiresAt: '2024-11-30T23:59:59Z',
          usedAt: '2024-02-10T14:22:00Z',
          createdAt: '2024-01-10T09:15:00Z',
          merchantId: 'merchant_1'
        },
        {
          id: 'gc_3',
          code: 'GIFT-2024-GHI789',
          amount: 100.00,
          currency: 'USD',
          status: 'expired',
          recipientEmail: 'expired@example.com',
          purchaserEmail: 'sender@example.com',
          message: 'Congratulations!',
          expiresAt: '2024-01-31T23:59:59Z',
          createdAt: '2023-12-01T16:45:00Z',
          merchantId: 'merchant_1'
        }
      ];

      setStats(mockStats);
      setGiftCards(mockGiftCards);
    } catch (error) {
      console.error('Failed to load gift cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'used': return 'info';
      case 'expired': return 'warning';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };


  const filteredGiftCards = giftCards.filter(card => {
    const matchesSearch = card.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         card.recipientEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         card.purchaserEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || card.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gift Cards</h1>
          <p className="text-muted-foreground mt-1">
            Manage and track GlobaGift digital gift card sales and redemptions
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Gift Card
        </Button>
      </div>

      {/* Stats Cards */}
      <StateWrapper
        loading={loading}
        empty={{
          title: 'No Gift Card Stats',
          description: 'Gift card statistics will appear here once you have data.',
          icon: Gift
        }}
        data={stats ? [stats] : []}
      >
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <Gift className="h-4 w-4 text-primary" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Total Cards</p>
                    <p className="text-2xl font-bold">{stats.totalCards.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-success/10 rounded-full">
                    <DollarSign className="h-4 w-4 text-success" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                    <p className="text-2xl font-bold">{formatCurrency(stats.totalValue, 'USD')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-info/10 rounded-full">
                    <Users className="h-4 w-4 text-info" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Active Cards</p>
                    <p className="text-2xl font-bold">{stats.activeCards.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-warning/10 rounded-full">
                    <TrendingUp className="h-4 w-4 text-warning" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Redemption Rate</p>
                    <p className="text-2xl font-bold">{stats.redemptionRate}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </StateWrapper>

      {/* GlobaGift Integration Alert */}
      <Alert>
        <Gift className="h-4 w-4" />
        <AlertDescription>
          <strong>GlobaGift Integration:</strong> This module integrates with GlobaGift&apos;s digital gift card platform. 
          Configure your GlobaGift API credentials in Settings to enable full functionality.
        </AlertDescription>
      </Alert>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Gift Card Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by code, recipient, or purchaser..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="used">Used</option>
                <option value="expired">Expired</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          <StateWrapper
            loading={loading}
            empty={{
              title: 'No Gift Cards Found',
              description: 'No gift cards match your current search criteria.',
              icon: Gift
            }}
            data={filteredGiftCards}
          >
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Gift Card Code</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Purchaser</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGiftCards.map((card) => (
                    <TableRow key={card.id}>
                      <TableCell>
                        <div className="font-mono text-sm">
                          {card.code}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {formatCurrency(card.amount, card.currency)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(card.status) as any}>
                          {card.status.charAt(0).toUpperCase() + card.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">{card.recipientEmail}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">{card.purchaserEmail}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {new Date(card.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className="mr-2 h-4 w-4" />
                              Export
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </StateWrapper>
        </CardContent>
      </Card>
    </div>
  );
}