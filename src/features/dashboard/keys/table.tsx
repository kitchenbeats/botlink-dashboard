import { Alert, AlertDescription, AlertTitle } from '@/ui/primitives/alert'
import { Loader } from '@/ui/loader'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/ui/primitives/table'
import { FC } from 'react'
import TableBodyContent from './table-body'
import { Suspense } from 'react'
import { cn } from '@/lib/utils'

interface ApiKeysTableProps {
  teamId: string
  className?: string
}

const ApiKeysTable: FC<ApiKeysTableProps> = ({ teamId, className }) => {
  return (
    <>
      <Table className={cn('w-full animate-in fade-in', className)}>
        <TableHeader>
          <TableRow>
            <TableHead className="text-left">Key</TableHead>
            <TableHead>Created By</TableHead>
            <TableHead className="text-right">Created At</TableHead>
            <th></th>
          </TableRow>
        </TableHeader>
        <TableBody>
          <Suspense
            fallback={
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-left">
                  <Alert className="w-full text-left" variant="contrast2">
                    <AlertTitle className="flex items-center gap-2">
                      <Loader />
                      Loading keys...
                    </AlertTitle>
                    <AlertDescription>This may take a moment.</AlertDescription>
                  </Alert>
                </TableCell>
              </TableRow>
            }
          >
            <TableBodyContent teamId={teamId} />
          </Suspense>
        </TableBody>
      </Table>
    </>
  )
}

export default ApiKeysTable
