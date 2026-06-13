// Donut chart drawn with react-native-svg (no heavy charting dependency).
// Each slice is a stroked circle whose dash array exposes only its arc.
import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { colors } from '../theme';

export function DonutChart({
  data,
  colors: sliceColors,
  size = 168,
  strokeWidth = 24,
  children,
}: {
  data: number[];
  colors: string[];
  size?: number;
  strokeWidth?: number;
  children?: ReactNode;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = data.reduce((a, b) => a + b, 0) || 1;

  let offset = 0;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        {/* Piste de fond */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.border}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <G rotation={-90} originX={size / 2} originY={size / 2}>
          {data.map((value, i) => {
            const arc = (value / total) * circumference;
            const slice = (
              <Circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={sliceColors[i] || colors.primary}
                strokeWidth={strokeWidth}
                fill="none"
                strokeDasharray={`${arc} ${circumference - arc}`}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
              />
            );
            offset += arc;
            return slice;
          })}
        </G>
      </Svg>
      {children ? <View style={[StyleSheet.absoluteFill, styles.center]}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
});
