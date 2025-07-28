"use client"

import { Session } from "next-auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, Clock, Calendar, Users } from "lucide-react"

interface Equipment {
  id: string
  name: string
  code: string
  category: string
  status: 'Working' | 'Standby' | 'Breakdown'
}

interface Department {
  id: string
  name: string
  code: string
  description?: string
}

interface DailyActivityTabProps {
  equipment: Equipment[]
  department: Department
  session: Session
}

export function DailyActivityTab({ equipment, department, session }: DailyActivityTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Aktivitas Harian - {department.name}
        </CardTitle>
        <CardDescription>
          Pencatatan aktivitas harian peralatan dengan sistem kolaboratif antar shift
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Development Status */}
          <div className="text-center py-8 border-2 border-dashed border-muted-foreground/25 rounded-lg">
            <Activity className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aktivitas Harian</h3>
            <p className="text-muted-foreground mb-4 max-w-md mx-auto">
              Fitur ini sedang dalam pengembangan. Akan tersedia pencatatan aktivitas harian dengan kolaborasi antar shift.
            </p>
            
            {/* Feature Preview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 max-w-2xl mx-auto">
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <Clock className="h-4 w-4 text-primary-600" />
                <span className="text-sm">Input jam Working, Standby, Breakdown</span>
              </div>
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <Calendar className="h-4 w-4 text-primary-600" />
                <span className="text-sm">Rincian aktivitas per periode</span>
              </div>
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <Users className="h-4 w-4 text-primary-600" />
                <span className="text-sm">Kolaborasi data antar shift</span>
              </div>
            </div>
          </div>

          {/* User Context */}
          <div className="border-t pt-4">
            <p className="text-xs text-muted-foreground">
              Logged in as: <span className="font-medium">{session.user.username}</span> 
              {' '}({session.user.role})
              {session.user.departmentName && (
                <span> - {session.user.departmentName}</span>
              )}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
