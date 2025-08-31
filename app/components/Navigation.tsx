"use client"

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { FileText, Settings } from 'lucide-react'

export default function Navigation() {
  const pathname = usePathname()
  
  return (
    <nav className="border-b px-4 py-3" style={{ backgroundColor: 'white', borderColor: '#e5e7eb' }}>
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold" style={{ color: '#111827' }}>🚀 Blog Elite</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Link href="/">
            <Button 
              variant={pathname === '/' ? 'default' : 'outline'} 
              size="sm"
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Generate
            </Button>
          </Link>
          
          <Link href="/settings">
            <Button 
              variant={pathname === '/settings' ? 'default' : 'outline'} 
              size="sm"
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  )
}
