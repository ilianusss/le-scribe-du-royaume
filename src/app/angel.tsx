import { angelTargets } from '@/flow/steps';
import { copy } from '@/ui/copy';
import { useSession } from '@/ui/SessionProvider';
import { TargetChoice } from '@/ui/TargetChoice';

export default function Angel() {
  const { session, dispatch } = useSession();
  return (
    <TargetChoice
      step="ANGEL"
      title={copy.angelTitle}
      question={copy.angelQuestion}
      noneLabel={copy.angelNone}
      owner="CH08"
      targets={angelTargets(session)}
      choice={session.angelChoice}
      onChoose={(choice) => dispatch({ type: 'SET_ANGEL', choice })}
    />
  );
}
