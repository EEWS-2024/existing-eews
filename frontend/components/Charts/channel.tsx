import {
  Line,
  XAxis,
  YAxis,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import dynamic from 'next/dynamic';
import { IChannel } from '@/lib/interfaces/channels';
import { setWaveformTimeFromChannel } from '@/lib/functions/setWaveformTimeFromChannel';
import { getWaveformStats } from '@/lib/functions/getWaveformStats';
import { useEEWS } from '@/lib/hooks/useEEWS';
const LineChart = dynamic(
  () => import('recharts').then((recharts) => recharts.LineChart),
  { ssr: false }
);

export const ChannelChart: React.FC<{ channel: IChannel }> = ({ channel }) => {
  const { packetsCount } = useEEWS();
  if (channel.waveform.data.length == 0) {
    return <div></div>;
  }
  const waveforms = setWaveformTimeFromChannel(channel, packetsCount);
  const [mean, max] = getWaveformStats(waveforms);
  const arr = channel.waveform.pick?.arrival;
  const nearest = arr ? waveforms.find((w) => w.time > arr) : null;

  return (
    <div className="grid grid-cols-12">
      <div className="col-span-1 px-2 relative items-center gap-x-2 grid grid-cols-2">
        <div className="flex flex-col h-full justify-center">
          <h6>{channel.stationCode}</h6>
          <div className="w-full border border-black"></div>
          <h6>{`[${channel.code}]`}</h6>
        </div>
        <div className="text-xs relative">
          <table className="absolute -translate-y-1/2">
            <tbody>
              <tr>
                <td>Amax</td>
                <td>{`:${max ?? '-'}`}</td>
              </tr>
              <tr>
                <td>Mean</td>
                <td>{`:${mean ?? '-'}`}</td>
              </tr>
              <tr>
                <td>Arrival</td>
                <td>
                  {`:${
                    nearest && arr
                      ? new Date(arr).toLocaleTimeString('en-US', {
                          hourCycle: 'h24',
                        })
                      : '-'
                  }`}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div className="col-span-11 w-full pt-4">
        <ResponsiveContainer width="100%" className="" height={100}>
          <LineChart
            data={waveforms}
            margin={{ top: 5, left: 0, right: 0, bottom: 0 }}
          >
            <XAxis
              dataKey="time"
              xAxisId={0}
              axisLine={true}
              tickSize={10}
              interval={Math.floor(waveforms.length / 9) - 10}
              domain={['auto', 'auto']}
              padding={'gap'}
              tickFormatter={(val) =>
                val
                  ? new Date(val).toLocaleTimeString('en-US', {
                      hourCycle: 'h24',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })
                  : ''
              }
            />
            <YAxis
              type="number"
              domain={([dataMin, dataMax]) => {
                const absMax = Math.max(
                  Math.abs(dataMin),
                  Math.abs(dataMax),
                  5000
                );
                return [-absMax, absMax];
              }}
              ticks={[0]}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#8884d8"
              strokeWidth={2}
              dot={false}
            />
            <ReferenceLine y={0} stroke="#888888" />
            {nearest && (
              <ReferenceLine stroke="red" strokeWidth={2} x={nearest.time} />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
