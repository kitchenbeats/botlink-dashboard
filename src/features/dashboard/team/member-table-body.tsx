import { Alert, AlertDescription, AlertTitle } from '@/ui/primitives/alert'
import { TableCell, TableRow } from '@/ui/primitives/table'
import MemberTableRow from './member-table-row'
import { getTeamMembers } from '@/server/team/get-team-members'
import { bailOutFromPPR } from '@/lib/utils/server'
import { ErrorIndicator } from '@/ui/error-indicator'

interface TableBodyContentProps {
  teamId: string
}

export default async function MemberTableBody({
  teamId,
}: TableBodyContentProps) {
  bailOutFromPPR()

  try {
    const result = await getTeamMembers({ teamId })

    if (result.type === 'error') {
      throw new Error(result.message)
    }

    const members = result.data

    if (members.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={5}>
            <Alert className="text-left" variant="contrast2">
              <AlertTitle>No Members</AlertTitle>
              <AlertDescription>No team members found.</AlertDescription>
            </Alert>
          </TableCell>
        </TableRow>
      )
    }

    return (
      <>
        {members.map((member, index) => (
          <MemberTableRow
            key={member.info.id}
            member={member}
            index={index}
            addedByEmail={
              members.find((m) => m.info.id === member.relation.added_by)?.info
                .email
            }
          />
        ))}
      </>
    )
  } catch (error) {
    return (
      <TableRow>
        <TableCell colSpan={5}>
          <ErrorIndicator
            description={'Could not load team members'}
            message={error instanceof Error ? error.message : 'Unknown error'}
            className="mt-2 w-full max-w-full bg-bg"
          />
        </TableCell>
      </TableRow>
    )
  }
}
