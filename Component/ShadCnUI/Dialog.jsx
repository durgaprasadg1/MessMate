import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

const DialogBox = ({ endpt }) => {
  const router = useRouter();

  const [form, setForm] = useState({
    message: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const sendTheMessage = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log("Bhej DIya Msg is End Pt Pe : ", endpt)
      const res = await fetch(endpt, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Failed");
      } else {
        toast.success("Message Sent");
        setTimeout(() => router.push("/admin/all-messes"), 500);
      }
    } catch (err) {
      toast.error("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog>
      <form >
        <DialogTrigger asChild>
          <Button className="bg-purple-300 text-black hover:bg-purple-500 rounded transition-colors duration-300" variant="outline">Message Owner</Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Send Message</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-3">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                name="message"
                onChange={handleChange}
                value={form.message}
                placeholder="Write your message here..."
              />
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button  onClick={(e)=> sendTheMessage(e)} type="submit" disabled={loading}>
              {loading ? "Sending..." : "Save changes"}
            </Button>
          </DialogClose>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
};

export default DialogBox;
