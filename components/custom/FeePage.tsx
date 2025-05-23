'use client'; 
import { useUser } from "@clerk/nextjs";  
import { Capturepaymet, Createpaymet, getFinById, UPdatePayment, verifyPayment } from "@/server/payemt.actions";
import { Batch, Fee, Sem } from "@prisma/client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fullname, setFeeAmount, setSEM } from "@/lib/utils";
import { sendEmailNode } from "@/lib/email";

const FeePage = ({ userId, batch, phone  ,email}: { userId: string; batch: Batch; phone?: string | null ,email:string }) => {
  const { user } = useUser();
  const collage = user?.publicMetadata?.collage as string;
  const clg = fullname.find((item) => item.collage === collage);
  const [paidSemesters, setPaidSemesters] = useState<Sem[]>([]);
  const [selectedSemester, setSelectedSemester] = useState<Sem | null>(null);
  const [fees, setFees] = useState<Fee[]>([]);
  const router = useRouter()
  useEffect(() => {
    const fetchUserData = async () => {
      if (userId) {
        try {
          const fees = await getFinById(userId);
          setFees(fees);
          setPaidSemesters(fees.map((fee:{semesterName:string}) => fee.semesterName));
        } catch (error) { 
        } 
      }
    };
    fetchUserData();
  }, [userId, user]);

  const handlePayment = async (amount: number) => {
    const data = await Createpaymet({ amount, currency: 'INR' });
    if (data?.id) {
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
        amount: data.amount,
        currency: data.currency,
        name: clg?.fname,
        description: 'Semester Fee',
        order_id: data.id,

        handler: async (response: any) => { 

          if (userId && selectedSemester) {
           const razorpay_payment_id =  response.razorpay_payment_id;
           const razorpay_order_id  =   response.razorpay_order_id;
           const razorpay_signature =   response.razorpay_signature;
          const res =  await createFee(userId, selectedSemester ,  razorpay_order_id, razorpay_payment_id, razorpay_signature );
            const updatedFees = await UPdatePayment(userId);

            if (updatedFees) {
              setPaidSemesters(updatedFees.map((fee:{semesterName:string}) => fee.semesterName));
            }
          }
        },
        prefill: {
          name: user?.firstName,
          email: user?.primaryEmailAddress?.emailAddress,
          contact: phone || '9999999999',
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } else { 
    }
  };
 
  const createFee = async (studentId: string, semesterName: Sem , razorpay_order_id:string, razorpay_payment_id:string, razorpay_signature:string  ) => {
    const amount = setFeeAmount(batch);
    
   const res =  await verifyPayment({ razorpay_order_id, razorpay_payment_id, razorpay_signature , studentId , semesterName , amount});

    if(res?.message =="success"){
      router.push("/list/fee?payment=success")
      await sendEmailNode({email:email ,message:` Fee for ${res.res.semesterName} sem has been paid Payment Id : ${res.res.razorpay_payment_id}  ` , subject:'Fee Payment Successfull'});  
      router.refresh()
      }
      else{
        router.push("/list/fee?payment=unsuccess")
        router.refresh()
      }
  };
  
  const getSemestersForBatch = (batch: Batch): Sem[] => {
    if (batch === "BCA" || batch === "BBA" || batch === "BSC") {
      return ["FIRST", "SECOND", "THIRD", "FOURTH", "FIFTH", "SIXTH"];
    }
    if (batch === "MSC" ) {
      return ["FIRST", "SECOND", "THIRD", "FOURTH", "FIFTH", "SIXTH", "SEVENTH", "EIGHTH"];
    }
    if (batch === "MTECH" || batch === "MCA") {
      return ["FIRST", "SECOND", "THIRD", "FOURTH"];
    }

    return ["FIRST", "SECOND", "THIRD", "FOURTH", "FIFTH", "SIXTH", "SEVENTH", "EIGHTH"];
  };

  const semesters = getSemestersForBatch(batch);
 

  return (
    <div className= " min-h-screen w-full">

      <div className="flex flex-col p-4 h-full">
        <h1 className="text-4xl text-[#3352cc] font-bold">Fee Payment</h1>
        <select
          className="mt-5 w-fit px-3 py-2 inshadow frame !rounded-xl border-2 border-[#ffffff70] !bg-transparent"
          name="semester"
          id="semester"
          value={selectedSemester || ""}
          onChange={(e) => setSelectedSemester(e.target.value as Sem)}
        >
          {semesters.map((sem) => (
            <option
              key={sem}
              value={sem}
              disabled={paidSemesters.includes(sem)}
              className="bg-[#000000d7] inshadow"
            >
              {setSEM(sem)} Semester
            </option>
          ))}
        </select>
        <button className="p-1 mt-5 px-5 buttonbg rounded-lg w-fit disabled:opacity-15 disabled:cursor-not-allowed"
          onClick={() => handlePayment(setFeeAmount(batch))}
          disabled={!selectedSemester || paidSemesters.includes(selectedSemester)}>Pay ₹{setFeeAmount(batch)}
        </button>
      </div>



      <div className='w-[97%] max-md:w-[95%] mx-auto inshadow frame rounded-xl min-h-[60vh] max-md:min-h-[70vh]'>
                <div className=' grid max-md:grid-cols-4 grid-cols-5 mb-3 border-b-2 border-[#ffffff47]  p-2 py-3 font-semibold'>
                    <h3>Amount</h3> 
                    <h3 >Semester</h3>
                    <h3 className=' max-md:hidden '>Payment Id</h3>
                    <h3 >Status</h3>
                    <h3 className=' max-md: ml-8'>Date</h3>
                </div>

                <div className=" px-4 max-md:px-2">
                    {fees && fees.map((f) => {
                        return (
                            <div key={f.razorpay_order_id} className='  grid items-center  max-md:grid-cols-4 grid-cols-5 inshadow py-2 mb-2 rounded-lg border-2 border-[#ffffff14] max-md:text-sm px-2'>
                                <p>₹ {f.amount}</p>
                                <p> {setSEM(f.semesterName)} Sem</p>
                                <p className=' max-md:hidden ' > {f.razorpay_payment_id ? <p>{f.razorpay_payment_id}</p>: '-----------------------' } </p>

                                <p className=" bg-[#00ff003f] text-[#7cff7c] rounded-xl px-2 py-1 w-fit ">Successfull</p>
                                <p>{new Date(f.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</p>
                            </div>
                        )
                    })}                   
                </div>
            </div>
    </div>
  );
};

export default FeePage;
