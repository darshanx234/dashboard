import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, CreditCard, DollarSign, Users } from 'lucide-react';

export default function Home() {
  const stats = [
    {
      title: 'Total Revenue',
      value: '$45,231.89',
      change: '+20.1% from last month',
      icon: DollarSign,
    },
    {
      title: 'Active Users',
      value: '+2,350',
      change: '+180.1% from last month',
      icon: Users,
    },
    {
      title: 'Sales',
      value: '+12,234',
      change: '+19% from last month',
      icon: CreditCard,
    },
    {
      title: 'Active Now',
      value: '+573',
      change: '+201 since last hour',
      icon: Activity,
    },
  ];

  return (
    <>
      <AppLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back! Here's an overview of your workspace.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.change}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Your most recent activities and updates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((item) => (
                    <div key={item} className="flex items-center gap-4">
                      <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-xs font-medium">{item}</span>
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">
                          Activity Item {item}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Description of the activity that occurred
                        </p>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {item}h ago
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Frequently used actions and shortcuts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {['Create New Project', 'Invite Team Member', 'Generate Report', 'View Analytics', 'Manage Settings'].map((action) => (
                    <button
                      key={action}
                      className="w-full text-left px-4 py-3 rounded-lg border border-border hover:bg-accent transition-colors"
                    >
                      <span className="text-sm font-medium">{action}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </AppLayout>
    </>
  );
}
