import { forwardRef, useState } from 'react';
import { ScrollView, type ScrollViewProps } from 'react-native';

export const ScrollArea = forwardRef<ScrollView, ScrollViewProps>(function ScrollArea(
  { onLayout, onContentSizeChange, ...props },
  ref,
) {
  const [viewport, setViewport] = useState(0);
  const [content, setContent] = useState(0);
  const overflows = content - viewport > 1;

  return (
    <ScrollView
      ref={ref}
      {...props}
      scrollEnabled={overflows}
      alwaysBounceVertical={false}
      bounces={overflows}
      showsVerticalScrollIndicator={overflows}
      onLayout={(event) => {
        setViewport(event.nativeEvent.layout.height);
        onLayout?.(event);
      }}
      onContentSizeChange={(width, height) => {
        setContent(height);
        onContentSizeChange?.(width, height);
      }}
    />
  );
});
