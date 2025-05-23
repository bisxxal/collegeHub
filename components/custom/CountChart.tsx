"use client"; 
import { BiMaleFemale } from "react-icons/bi";
import { RadialBarChart, RadialBar,  ResponsiveContainer, Tooltip,} from "recharts";

const CountChart = ({boys , girls}:{boys:number , girls:number}) => {

  const data = [
    {
      name: "Total",
      count: boys+girls,
      fill: "#ef7cca",
    },
    {
      name: "Girls",
      count: girls,
      fill: "#E11D47",
    },
    {
      name: "Boys",
      count: boys,
      fill: "#3352cc",
    },
  ];
  return (
    <div className="relative w-full h-[75%]">
      <div  className="absolute text-4xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <BiMaleFemale />
        </div> 
        <ResponsiveContainer>
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="40%"
            outerRadius="100%"
            barSize={32}
            data={data}
          >
            <RadialBar
             background
             name="name"
            dataKey="count" />
          </RadialBarChart>
        </ResponsiveContainer>
        
    </div>
  );
};

export default CountChart;