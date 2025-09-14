'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Send, AlertCircle, CheckCircle, Clock, Trash2 } from 'lucide-react';
import { WEBHOOK_EXAMPLES } from '@/lib/webhook-examples';

interface WebhookHistory {
  id: string;
  endpoint: string;
  provider: string;
  payload: string;
  headers: Record<string, string>;
  response?: {
    status: number;
    body: string;
    timestamp: Date;
  };
  timestamp: Date;
}

export default function WebhookInjectorPage() {
  const [provider, setProvider] = useState<string>('psp');
  const [endpoint, setEndpoint] = useState<string>('/webhooks/psp');
  const [payload, setPayload] = useState<string>('');
  const [headers, setHeaders] = useState<string>('{}');
  const [customHeaders, setCustomHeaders] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [response, setResponse] = useState<any>(null);
  const [history, setHistory] = useState<WebhookHistory[]>([]);

  // Load example payload when provider changes
  const handleProviderChange = (value: string) => {
    setProvider(value);
    setEndpoint(`/webhooks/${value}`);
    
    // Load example payload
    const examples = WEBHOOK_EXAMPLES[value as keyof typeof WEBHOOK_EXAMPLES];
    if (examples) {
      const exampleKey = Object.keys(examples)[0];
      setPayload(JSON.stringify(examples[exampleKey as keyof typeof examples], null, 2));
    }
  };

  const handleLoadExample = (exampleKey: string) => {
    const examples = WEBHOOK_EXAMPLES[provider as keyof typeof WEBHOOK_EXAMPLES];
    if (examples && examples[exampleKey as keyof typeof examples]) {
      setPayload(JSON.stringify(examples[exampleKey as keyof typeof examples], null, 2));
    }
  };

  const handleAddCustomHeader = () => {
    const key = prompt('Header name:');
    const value = prompt('Header value:');
    if (key && value) {
      setCustomHeaders(prev => ({ ...prev, [key]: value }));
    }
  };

  const handleRemoveCustomHeader = (key: string) => {
    setCustomHeaders(prev => {
      const newHeaders = { ...prev };
      delete newHeaders[key];
      return newHeaders;
    });
  };

  const handleSendWebhook = async () => {
    try {
      setLoading(true);
      setResponse(null);

      // Parse headers
      let parsedHeaders = {};
      try {
        parsedHeaders = JSON.parse(headers);
      } catch {
        parsedHeaders = {};
      }

      // Merge with custom headers
      const allHeaders: Record<string, any> = {
        'Content-Type': 'application/json',
        ...parsedHeaders,
        ...customHeaders,
      };

      // Add fake signature for testing
      if (!allHeaders['x-signature'] && !allHeaders['signature']) {
        allHeaders['x-signature'] = 'sha256=fake_signature_for_testing';
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
      const fullUrl = `${apiUrl}${endpoint}`;

      const startTime = Date.now();
      const fetchResponse = await fetch(fullUrl, {
        method: 'POST',
        headers: allHeaders,
        body: payload,
      });

      const responseBody = await fetchResponse.text();
      const endTime = Date.now();

      const webhookResponse = {
        status: fetchResponse.status,
        statusText: fetchResponse.statusText,
        headers: Object.fromEntries(Array.from(fetchResponse.headers.entries()) as [string, string][]),
        body: responseBody,
        duration: endTime - startTime,
        timestamp: new Date(),
      };

      setResponse(webhookResponse);

      // Add to history
      const historyEntry: WebhookHistory = {
        id: Date.now().toString(),
        endpoint,
        provider,
        payload,
        headers: allHeaders,
        response: {
          status: webhookResponse.status,
          body: responseBody,
          timestamp: new Date(),
        },
        timestamp: new Date(),
      };

      setHistory(prev => [historyEntry, ...prev.slice(0, 9)]); // Keep last 10

    } catch (error) {
      console.error('Webhook send failed:', error);
      setResponse({
        status: 0,
        statusText: 'Network Error',
        body: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const clearHistory = () => {
    setHistory([]);
  };

  const replayFromHistory = (entry: WebhookHistory) => {
    setProvider(entry.provider);
    setEndpoint(entry.endpoint);
    setPayload(entry.payload);
    setHeaders(JSON.stringify(entry.headers, null, 2));
    setCustomHeaders({});
  };

  // Show warning if not in development
  if (process.env.NODE_ENV === 'production') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Webhook Injector is only available in development mode.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Webhook Injector</h1>
        <p className="text-gray-600">
          Development tool for testing webhook endpoints with custom payloads and headers.
        </p>
        <Badge variant="secondary" className="mt-2">Development Only</Badge>
      </div>

      <Tabs defaultValue="injector" className="space-y-6">
        <TabsList>
          <TabsTrigger value="injector">Injector</TabsTrigger>
          <TabsTrigger value="history">
            History
            {history.length > 0 && (
              <Badge variant="secondary" className="ml-2">{history.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="injector" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Configuration Panel */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Webhook Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="provider">Provider</Label>
                    <Select value={provider} onValueChange={handleProviderChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select provider" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="psp">PSP (Payment Service Provider)</SelectItem>
                        <SelectItem value="fraud">Fraud Detection</SelectItem>
                        <SelectItem value="kyb">KYB (Know Your Business)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="endpoint">Endpoint</Label>
                    <Input
                      id="endpoint"
                      value={endpoint}
                      onChange={(e) => setEndpoint(e.target.value)}
                      placeholder="/webhooks/psp"
                    />
                  </div>

                  <div>
                    <Label>Load Example</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {provider && WEBHOOK_EXAMPLES[provider as keyof typeof WEBHOOK_EXAMPLES] && 
                        Object.keys(WEBHOOK_EXAMPLES[provider as keyof typeof WEBHOOK_EXAMPLES]).map(key => (
                          <Button
                            key={key}
                            variant="outline"
                            size="sm"
                            onClick={() => handleLoadExample(key)}
                          >
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </Button>
                        ))
                      }
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Headers</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="headers">JSON Headers</Label>
                    <Textarea
                      id="headers"
                      value={headers}
                      onChange={(e) => setHeaders(e.target.value)}
                      placeholder='{"x-signature": "sha256=..."}'
                      className="min-h-[100px] font-mono text-sm"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Custom Headers</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleAddCustomHeader}
                      >
                        Add Header
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {Object.entries(customHeaders).map(([key, value]) => (
                        <div key={key} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                          <span className="font-mono text-sm">{key}:</span>
                          <span className="font-mono text-sm flex-1">{value}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveCustomHeader(key)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Payload Panel */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Payload
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(payload)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={payload}
                    onChange={(e) => setPayload(e.target.value)}
                    placeholder="Enter JSON payload..."
                    className="min-h-[400px] font-mono text-sm"
                  />
                </CardContent>
              </Card>

              <Button
                onClick={handleSendWebhook}
                disabled={loading || !payload.trim()}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Webhook
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Response Panel */}
          {response && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Response
                  {response.status >= 200 && response.status < 300 ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                  <Badge 
                    variant={response.status >= 200 && response.status < 300 ? "success" : "destructive"}
                  >
                    {response.status} {response.statusText}
                  </Badge>
                  {response.duration && (
                    <Badge variant="outline">
                      {response.duration}ms
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label>Response Body</Label>
                    <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm">
                      {response.body}
                    </pre>
                  </div>
                  
                  {response.headers && Object.keys(response.headers).length > 0 && (
                    <div>
                      <Label>Response Headers</Label>
                      <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm">
                        {JSON.stringify(response.headers, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Webhook History
                {history.length > 0 && (
                  <Button variant="outline" size="sm" onClick={clearHistory}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear History
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No webhook history yet.</p>
              ) : (
                <div className="space-y-4">
                  {history.map((entry) => (
                    <div key={entry.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{entry.provider.toUpperCase()}</Badge>
                          <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                            {entry.endpoint}
                          </code>
                          {entry.response && (
                            <Badge 
                              variant={entry.response.status >= 200 && entry.response.status < 300 ? "success" : "destructive"}
                            >
                              {entry.response.status}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span>{entry.timestamp.toLocaleTimeString()}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => replayFromHistory(entry)}
                          >
                            Replay
                          </Button>
                        </div>
                      </div>
                      
                      <details className="text-sm">
                        <summary className="cursor-pointer text-gray-600 hover:text-gray-900">
                          View payload and response
                        </summary>
                        <div className="mt-2 space-y-2">
                          <div>
                            <Label>Payload</Label>
                            <pre className="bg-gray-50 p-2 rounded text-xs overflow-x-auto max-h-32">
                              {entry.payload}
                            </pre>
                          </div>
                          {entry.response && (
                            <div>
                              <Label>Response</Label>
                              <pre className="bg-gray-50 p-2 rounded text-xs overflow-x-auto max-h-32">
                                {entry.response.body}
                              </pre>
                            </div>
                          )}
                        </div>
                      </details>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}