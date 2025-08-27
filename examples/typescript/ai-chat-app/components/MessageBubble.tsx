import { Message } from '@/types/chat'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface MessageBubbleProps {
  message: Message
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const isSystem = message.role === 'system'
  
  if (isSystem) {
    return (
      <div className="flex justify-center my-4">
        <Card className="bg-muted/50 text-muted-foreground text-sm px-4 py-2 max-w-2xl">
          {message.content}
        </Card>
      </div>
    )
  }
  
  return (
    <div className={cn(
      "flex mb-4",
      isUser ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "max-w-[70%] space-y-2",
        isUser && "items-end"
      )}>
        <Card className={cn(
          "p-4",
          isUser 
            ? "bg-primary text-primary-foreground ml-auto" 
            : "bg-card text-card-foreground"
        )}>
          <div className="whitespace-pre-wrap break-words">
            {message.content}
          </div>
        </Card>
        
        <div className={cn(
          "text-xs text-muted-foreground px-2",
          isUser ? "text-right" : "text-left"
        )}>
          {new Date(message.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  )
}