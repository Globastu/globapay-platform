'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Gift, 
  TrendingUp, 
  Users, 
  DollarSign,
  ExternalLink,
  Settings,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

interface StatCardData {
  title: string;
  value: string;
  change: string;
  changeType: 'increase' | 'decrease';
  icon: React.ElementType;
}

export default function GiftCardsPage() {
  const isGlobaGiftEnabled = process.env.NEXT_PUBLIC_GLOBAGIFT_ENABLED === '1';
  const [activeTab, setActiveTab] = useState('analytics');

  const giftCardStats: StatCardData[] = [
    {
      title: 'Cards Sold Today',
      value: '47',
      change: '+12%',
      changeType: 'increase',
      icon: Gift,
    },
    {
      title: 'Total Revenue',
      value: '$12,350',
      change: '+8.2%',
      changeType: 'increase',
      icon: DollarSign,
    },
    {
      title: 'Active Cards',
      value: '234',
      change: '+15.3%',
      changeType: 'increase',
      icon: Users,
    },
    {
      title: 'Redemption Rate',
      value: '89%',
      change: '+2.1%',
      changeType: 'increase',
      icon: TrendingUp,
    },
  ];

  if (!isGlobaGiftEnabled) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gift Cards</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Sell and manage digital gift cards with GlobaGift
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center min-h-[500px]">
          <Card className="w-full max-w-2xl">
            <CardContent className="p-12 text-center">
              <div className="mb-6">
                <div className="mx-auto w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                  <Gift className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Enable GlobaGift
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                  Start selling digital gift cards to increase customer retention and revenue. 
                  GlobaGift makes it easy to create, customize, and manage gift card programs.
                </p>
              </div>
              
              <div className="space-y-4">
                <Button size="lg" className="w-full sm:w-auto">
                  <Settings className="w-4 h-4 mr-2" />
                  Enable GlobaGift
                </Button>
                <div className="flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
                  <ExternalLink className="w-4 h-4 mr-1" />
                  Learn more about GlobaGift features
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Key Features
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Custom Designs</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Brand your gift cards</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Analytics</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Track performance</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Easy Integration</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Simple API setup</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Multi-currency</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Global support</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gift Cards</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your GlobaGift digital gift card program
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            GlobaGift Enabled
          </Badge>
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:grid-cols-2">
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="manage" className="flex items-center gap-2">
            <Gift className="w-4 h-4" />
            Manage
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {giftCardStats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index} className="hover:shadow-md transition-shadow duration-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          {stat.title}
                        </p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {stat.value}
                        </p>
                        <div className="flex items-center mt-1">
                          {stat.changeType === 'increase' ? (
                            <ArrowUpRight className="w-4 h-4 text-green-500" />
                          ) : (
                            <ArrowDownRight className="w-4 h-4 text-red-500" />
                          )}
                          <span className={`text-sm font-medium ${
                            stat.changeType === 'increase' 
                              ? 'text-green-600 dark:text-green-400' 
                              : 'text-red-600 dark:text-red-400'
                          }`}>
                            {stat.change}
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
                            vs last period
                          </span>
                        </div>
                      </div>
                      <div className="p-3 bg-primary/10 rounded-2xl">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Gift Card Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80 flex items-center justify-center text-gray-500 dark:text-gray-400">
                Analytics charts will be displayed here
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="w-5 h-5" />
                GlobaGift Management Console
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="w-full h-[600px] border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <iframe
                  src="https://globagift-ui-canvas.vercel.app/gift-cards/information"
                  className="w-full h-full border-0"
                  title="GlobaGift Management Console"
                  allow="fullscreen"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}