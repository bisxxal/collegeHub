import BigCalenderContainer from "@/components/custom/BigCalenderContainer";
import EventCalendar from "@/components/custom/EventCalendar";
import EventList from "@/components/custom/EventList";
import GaugeChart2 from "@/components/custom/GaugeChart";
import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";

 
const StudentPage = async( {searchParams}:{searchParams:{[key:string]:string | undefined}}) => {
  const user = await currentUser()
  const {date} = searchParams;
  const classItem = await prisma.class.findMany({
    where: {
      students: { some: { id: user?.id! } },
    },
  });

  return (
    <div className="p-4 bg-[#161621 flex gap-4 flex-col xl:flex-row">
      <div className="w-full xl:w-2/3">
        <div className="h-fit pb-9 bg-[#161621] inshadow frame2 p-4 rounded-2xl ">
          <h1 className="text-xl font-semibold">Schedule</h1>
          <BigCalenderContainer type="classId" id={classItem[0].id} />
          
        </div>
      </div>
      <div className="w-full xl:w-1/3 flex flex-col gap-8">

      <div className=" rounded-2xl frame2">
        <h1 className=" text-xl font-semibold  text-center mt-5">Academic score</h1>
        <GaugeChart2 />
      </div>
        <EventCalendar />
        <div className=" mt-3">
        <h1 className=" text-center my-5 ">All Events</h1>
        <EventList dateParam={date}/>
      </div>

     
      </div>

    </div>
  );
};

export default StudentPage;