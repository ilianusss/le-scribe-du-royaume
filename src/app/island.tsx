import { islandTargets } from '@/flow/steps';
import { copy } from '@/ui/copy';
import { useSession } from '@/ui/SessionProvider';
import { TargetChoice } from '@/ui/TargetChoice';

export default function Island() {
  const { session, dispatch } = useSession();
  return (
    <TargetChoice
      step="ISLAND"
      title={copy.islandTitle}
      question={copy.islandQuestion}
      noneLabel={copy.islandNone}
      owner="FR09"
      targets={islandTargets(session)}
      choice={session.islandChoice}
      onChoose={(choice) => dispatch({ type: 'SET_ISLAND', choice })}
    />
  );
}
