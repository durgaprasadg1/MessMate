"use client"
import React, { useEffect, useState } from 'react'
import {useRouter} from 'next/navigation'
import Loading from '../../../../Component/Loading';
import { useSession } from 'next-auth/react';
import { toast } from 'react-toastify';

const NewMessForm = () => {
  const {data: session } = useSession();
  console.log("Session ID " , session?.user?.id)
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    description: '',
    address: '',
    category: '',
    limits: 'true',
    ownerName: '',
    adharNumber: '',
    phoneNumber: '',
    lat: '',
    lon: '',
  })
  const [image, setImage] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    if (!navigator?.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((s) => ({ ...s, lat: pos.coords.latitude, lon: pos.coords.longitude }))
      },
      (err) => {
        console.warn('Location denied or unavailable', err)
      }
    )
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((s) => ({ ...s, [name]: value }))
  }

  const handleFile = (e) => {
    setImage(e.target.files?.[0] ?? null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage(null)
    setLoading(true)
    try {
      const fd = new FormData()
      console.log("formData : ",fd)
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      if (image) fd.append('image', image)

        
      const res = await fetch(`/api/consumer/${session?.user?.id}/new-mess`, { method: 'POST', body: fd })
      const data = await res.json();

      if (!res.ok) {
        // throw new Error(data?.error || data?.message || 'Failed')
        toast.error(data?.error || data?.message )
        return
      }
      setMessage({ type: 'success', text: 'Mess added successfully' })
      setForm({ name: '', description: '', address: '', category: '', limits: 'true', ownerName: '', adharNumber: '', phoneNumber: '', lat: form.lat, lon: form.lon })
      setImage(null)
      alert("Mess Verification will be done and after successfull verification, your mess will be added automatically.")
      router.push('/mess')
    } catch (err) {
      console.error(err)
      setMessage({ type: 'error', text: err.message ?? 'Submission failed' })
    } finally {
      setLoading(false)
    }
  }

  if(loading){
    <Loading/>
  }
  return (
    <div className="min-h-screen bg-[--light-bg] py-12 px-4">


      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-2xl font-bold text-orange-600 mb-3 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M7 7v10a2 2 0 002 2h6a2 2 0 002-2V7" /></svg>
          Add New Mess
        </h3>
          <p className="text-center text-gray-500 text-sm mt-3 italic bg-yellow-100 border border-yellow-300 px-4 py-2 rounded-lg shadow-sm">
            ⚠️ Please add your mess details <span className="font-semibold">only when you are physically present at the mess location</span>, as your <span className="font-semibold">current location will be automatically tracked.{"\n"}The mess will be gone for verification after successfull verification it is added automatically.</span>.
          </p>

        {message && (
          <div className={`mb-4 p-3 rounded ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} encType="multipart/form-data" className="space-y-4">
          <div>
            <label className="block font-medium text-gray-700">Mess Name</label>
            <input name="name" value={form.name} onChange={handleChange} required className="mt-1 w-full border rounded-md px-3 py-2" placeholder="e.g., Kakunchi Mess" />
          </div>

          <div>
            <label className="block font-medium text-gray-700">Tagline / Description</label>
            <input name="description" value={form.description} onChange={handleChange} className="mt-1 w-full border rounded-md px-3 py-2" placeholder="Short tagline" />
          </div>

          <div>
            <label className="block font-medium text-gray-700">Address</label>
            <input name="address" value={form.address} onChange={handleChange} required className="mt-1 w-full border rounded-md px-3 py-2" placeholder="Full address" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-gray-700">Category</label>
              <select name="category" value={form.category} onChange={handleChange} required className="mt-1 w-full border rounded-md px-3 py-2">
                <option value="">Select Category</option>
                <option value="veg">Veg</option>
                <option value="nonveg">Non-Veg</option>
                <option value="both">Both (Veg + Non-Veg)</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-gray-700">Limits</label>
              <select name="limits" value={form.limits} onChange={handleChange} className="mt-1 w-full border rounded-md px-3 py-2">
                <option value="true">Limited</option>
                <option value="false">Unlimited</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-gray-700">Owner Name</label>
              <input name="ownerName" value={form.ownerName} onChange={handleChange} minLength={3} required className="mt-1 w-full border rounded-md px-3 py-2" placeholder="Owner full name" />
            </div>

            <div>
              <label className="block font-medium text-gray-700">Aadhaar Number</label>
              <input name="adharNumber" value={form.adharNumber} onChange={handleChange} pattern="\d{12}" required className="mt-1 w-full border rounded-md px-3 py-2" placeholder="000000000000" />
            </div>
          </div>

          <div>
            <label className="block font-medium text-gray-700">Phone Number</label>
            <input name="phoneNumber" value={form.phoneNumber} onChange={handleChange} pattern="\d{10}" required className="mt-1 w-full border rounded-md px-3 py-2" placeholder="9999999999" />
          </div>

          <input type="hidden" name="lat" value={form.lat} />
          <input type="hidden" name="lon" value={form.lon} />

          <div>
            <label className="block font-medium text-gray-700">Mess Banner (jpg, jpeg, png)</label>
            <input type="file" name="image" accept=".jpg,.jpeg,.png" onChange={handleFile}  className="mt-1 w-full border-gray-600" />
          </div>

          <div>
            <button type="submit" disabled={loading} className="w-full bg-gray-600 hover:bg-black text-white py-2 rounded-full font-semibold">
              {loading ? 'Submitting...' : 'Add Mess'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default NewMessForm